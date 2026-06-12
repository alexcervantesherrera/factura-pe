using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PosApi;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

var jwtKey = builder.Configuration["Jwt:Key"] ?? "CHANGE_ME_IN_PRODUCTION_32chars!!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new()
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer   = false,
            ValidateAudience = false,
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddHttpClient("off", c =>
{
    c.BaseAddress = new Uri("https://world.openfoodfacts.org/");
    c.DefaultRequestHeaders.Add("User-Agent", "factura-pe/1.0");
    c.Timeout = TimeSpan.FromSeconds(5);
});

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

Guid UserId(ClaimsPrincipal c)    => Guid.Parse(c.FindFirstValue(ClaimTypes.NameIdentifier)!);
Guid EmpresaId(ClaimsPrincipal c) => Guid.Parse(c.FindFirstValue("empresa")!);

string GenerateToken(Usuario u)
{
    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, u.Id.ToString()),
        new Claim(ClaimTypes.Email, u.Email),
        new Claim(ClaimTypes.Name, u.Nombre),
        new Claim(ClaimTypes.Role, u.Rol),
        new Claim("empresa", u.EmpresaId.ToString()),
    };
    var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    var token = new System.IdentityModel.Tokens.Jwt.JwtSecurityToken(
        claims: claims, expires: DateTime.UtcNow.AddDays(30), signingCredentials: creds);
    return new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler().WriteToken(token);
}

// ── AUTH ─────────────────────────────────────────────────────────────────────

app.MapPost("/auth/register", async (RegisterDto dto, AppDbContext db) =>
{
    if (await db.Empresas.AnyAsync(e => e.Ruc == dto.Ruc))
        return Results.Conflict("RUC ya registrado");
    if (await db.Usuarios.AnyAsync(u => u.Email == dto.Email))
        return Results.Conflict("Email ya registrado");

    var empresa = new Empresa
    {
        Ruc            = dto.Ruc,
        RazonSocial    = dto.RazonSocial,
        Direccion      = dto.Direccion ?? "",
        SolUsuario     = dto.SolUsuario ?? "",
        SolPasswordEnc = dto.SolPassword != null
            ? Convert.ToBase64String(Encoding.UTF8.GetBytes(dto.SolPassword)) : "",
    };
    var usuario = new Usuario
    {
        EmpresaId = empresa.Id,
        Nombre    = dto.NombreAdmin,
        Email     = dto.Email,
        PassHash  = BCrypt.Net.BCrypt.HashPassword(dto.Password),
        Rol       = "admin",
    };
    db.Empresas.Add(empresa);
    db.Usuarios.Add(usuario);
    // Seed default product catalog for this new empresa
    db.Productos.AddRange(ProductosSeed.GetDefaultProductos(empresa.Id));
    await db.SaveChangesAsync();
    return Results.Ok(new { token = GenerateToken(usuario), usuario.Nombre, usuario.Rol, empresa.RazonSocial });
});

app.MapPost("/auth/login", async (LoginDto dto, AppDbContext db) =>
{
    var u = await db.Usuarios.Include(x => x.Empresa)
        .FirstOrDefaultAsync(x => x.Email == dto.Email);
    if (u is null || !BCrypt.Net.BCrypt.Verify(dto.Password, u.PassHash))
        return Results.Unauthorized();
    return Results.Ok(new { token = GenerateToken(u), u.Nombre, u.Rol, u.Empresa.RazonSocial });
});

// ── PRODUCTOS ─────────────────────────────────────────────────────────────────

app.MapGet("/productos", async (string? q, ClaimsPrincipal claims, AppDbContext db) =>
{
    var eid   = EmpresaId(claims);
    var query = db.Productos.Where(p => p.EmpresaId == eid && p.Activo);
    if (!string.IsNullOrWhiteSpace(q))
        query = query.Where(p => p.Nombre.ToLower().Contains(q.ToLower())
                              || (p.CodigoBarras != null && p.CodigoBarras.Contains(q)));
    return Results.Ok(await query.OrderBy(p => p.Nombre).Take(100).ToListAsync());
}).RequireAuthorization();

app.MapGet("/productos/barcode/{code}", async (
    string code, ClaimsPrincipal claims, AppDbContext db, IHttpClientFactory factory) =>
{
    var eid = EmpresaId(claims);
    var local = await db.Productos.FirstOrDefaultAsync(
        p => p.EmpresaId == eid && p.CodigoBarras == code && p.Activo);
    if (local != null) return Results.Ok(new { found = true, source = "local", producto = local });

    try
    {
        var http = factory.CreateClient("off");
        var res  = await http.GetFromJsonAsync<OFFResponse>(
            $"api/v2/product/{code}?fields=product_name,image_front_small_url,categories_tags");
        if (res?.Status == 1 && res.Product?.ProductName is { Length: > 0 } name)
            return Results.Ok(new
            {
                found    = true,
                source   = "openfoodfacts",
                sugerido = new { nombre = name, imagen = res.Product.ImageUrl,
                    categoria = res.Product.Categories?.FirstOrDefault()?.Replace("en:", ""),
                    codigoBarras = code }
            });
    }
    catch { }

    return Results.Ok(new { found = false, source = (string?)null });
}).RequireAuthorization();

app.MapPost("/productos", async (ProductoDto dto, ClaimsPrincipal claims, AppDbContext db) =>
{
    var p = new Producto
    {
        EmpresaId = EmpresaId(claims), CodigoBarras = dto.CodigoBarras,
        Nombre = dto.Nombre, Categoria = dto.Categoria, ImagenUrl = dto.ImagenUrl,
        Precio = dto.Precio, AplicaIgv = dto.AplicaIgv, Stock = dto.Stock, ControlStock = dto.ControlStock,
        Unidad = dto.Unidad ?? "pz",
    };
    db.Productos.Add(p);
    await db.SaveChangesAsync();
    return Results.Created($"/productos/{p.Id}", p);
}).RequireAuthorization();

app.MapPut("/productos/{id:guid}", async (Guid id, ProductoDto dto, ClaimsPrincipal claims, AppDbContext db) =>
{
    var eid = EmpresaId(claims);
    var p = await db.Productos.FirstOrDefaultAsync(x => x.Id == id && x.EmpresaId == eid);
    if (p is null) return Results.NotFound();
    (p.CodigoBarras, p.Nombre, p.Categoria, p.ImagenUrl, p.Precio, p.AplicaIgv, p.Stock, p.ControlStock, p.Unidad) =
        (dto.CodigoBarras, dto.Nombre, dto.Categoria, dto.ImagenUrl, dto.Precio, dto.AplicaIgv, dto.Stock, dto.ControlStock, dto.Unidad ?? p.Unidad);
    await db.SaveChangesAsync();
    return Results.Ok(p);
}).RequireAuthorization();

app.MapDelete("/productos/{id:guid}", async (Guid id, ClaimsPrincipal claims, AppDbContext db) =>
{
    var eid = EmpresaId(claims);
    var p = await db.Productos.FirstOrDefaultAsync(x => x.Id == id && x.EmpresaId == eid);
    if (p is null) return Results.NotFound();
    p.Activo = false;
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

// Import default catalog — skips products whose name already exists for this empresa
app.MapPost("/productos/importar-defaults", async (ClaimsPrincipal claims, AppDbContext db) =>
{
    var eid = EmpresaId(claims);
    var existing = await db.Productos
        .Where(p => p.EmpresaId == eid)
        .Select(p => p.Nombre.ToLower())
        .ToListAsync();
    var toAdd = ProductosSeed.GetDefaultProductos(eid)
        .Where(p => !existing.Contains(p.Nombre.ToLower()))
        .ToList();
    if (toAdd.Count == 0)
        return Results.Ok(new { importados = 0, mensaje = "El catálogo base ya está importado." });
    db.Productos.AddRange(toAdd);
    await db.SaveChangesAsync();
    return Results.Ok(new { importados = toAdd.Count, mensaje = $"{toAdd.Count} productos importados." });
}).RequireAuthorization();

// ── CLIENTES ──────────────────────────────────────────────────────────────────

app.MapGet("/clientes", async (string? q, ClaimsPrincipal claims, AppDbContext db) =>
{
    var eid   = EmpresaId(claims);
    var query = db.Clientes.Where(c => c.EmpresaId == eid);
    if (!string.IsNullOrWhiteSpace(q))
        query = query.Where(c => c.Nombre.ToLower().Contains(q.ToLower()) || c.NumDoc.Contains(q));
    return Results.Ok(await query.OrderBy(c => c.Nombre).Take(50).ToListAsync());
}).RequireAuthorization();

app.MapPost("/clientes", async (ClienteDto dto, ClaimsPrincipal claims, AppDbContext db) =>
{
    var c = new Cliente
    {
        EmpresaId = EmpresaId(claims), TipoDoc = dto.TipoDoc,
        NumDoc = dto.NumDoc, Nombre = dto.Nombre, Email = dto.Email, Telefono = dto.Telefono,
    };
    db.Clientes.Add(c);
    await db.SaveChangesAsync();
    return Results.Created($"/clientes/{c.Id}", c);
}).RequireAuthorization();

// ── VENTAS ────────────────────────────────────────────────────────────────────

app.MapGet("/ventas", async (DateTime? desde, DateTime? hasta, ClaimsPrincipal claims, AppDbContext db) =>
{
    var eid  = EmpresaId(claims);
    desde  ??= DateTime.UtcNow.Date;
    hasta  ??= desde.Value.AddDays(1);
    return Results.Ok(await db.Ventas
        .Include(v => v.Usuario).Include(v => v.Cliente).Include(v => v.Comprobante)
        .Where(v => v.EmpresaId == eid && v.Fecha >= desde && v.Fecha < hasta)
        .OrderByDescending(v => v.Fecha)
        .Select(v => new {
            v.Id, v.Fecha, v.Subtotal, v.Igv, v.Total, v.Estado,
            usuario  = v.Usuario.Nombre,
            cliente  = v.Cliente != null ? v.Cliente.Nombre : "Consumidor final",
            comprobante = v.Comprobante == null ? null : new {
                v.Comprobante.Tipo, v.Comprobante.Serie,
                v.Comprobante.Correlativo, v.Comprobante.EstadoSunat }
        }).ToListAsync());
}).RequireAuthorization();

app.MapGet("/ventas/{id:guid}", async (Guid id, ClaimsPrincipal claims, AppDbContext db) =>
{
    var eid = EmpresaId(claims);
    var v = await db.Ventas
        .Include(x => x.Detalles).ThenInclude(d => d.Producto)
        .Include(x => x.Cliente).Include(x => x.Usuario).Include(x => x.Comprobante)
        .FirstOrDefaultAsync(x => x.Id == id && x.EmpresaId == eid);
    return v is null ? Results.NotFound() : Results.Ok(v);
}).RequireAuthorization();

app.MapPost("/ventas", async (VentaDto dto, ClaimsPrincipal claims, AppDbContext db) =>
{
    var eid = EmpresaId(claims);
    var uid = UserId(claims);
    decimal subtotal = 0, igv = 0;
    var detalles = new List<DetalleVenta>();

    foreach (var item in dto.Items)
    {
        var prod = await db.Productos.FindAsync(item.ProductoId);
        if (prod is null || prod.EmpresaId != eid)
            return Results.BadRequest($"Producto {item.ProductoId} no encontrado");

        var precioUnit = item.PrecioOverride ?? prod.Precio;
        var itemIgv    = prod.AplicaIgv ? Math.Round(precioUnit * item.Cantidad * 0.18m / 1.18m, 2) : 0;
        var itemSub    = Math.Round(precioUnit * item.Cantidad - itemIgv, 2);
        var itemTotal  = precioUnit * item.Cantidad;
        subtotal += itemSub; igv += itemIgv;
        detalles.Add(new DetalleVenta
        {
            ProductoId = prod.Id, NombreProducto = prod.Nombre, PrecioUnitario = precioUnit,
            Cantidad = item.Cantidad, Subtotal = itemSub, Igv = itemIgv, Total = itemTotal,
        });
        if (prod.ControlStock) prod.Stock -= (int)Math.Round(item.Cantidad);
    }

    var venta = new Venta
    {
        EmpresaId = eid, UsuarioId = uid, ClienteId = dto.ClienteId,
        Subtotal = Math.Round(subtotal, 2), Igv = Math.Round(igv, 2),
        Total = Math.Round(subtotal + igv, 2), Detalles = detalles,
    };
    db.Ventas.Add(venta);

    var tipo  = dto.TipoComprobante ?? "03";
    var serie = tipo == "01" ? "F001" : "B001";
    var maxCorr = await db.Comprobantes
        .Where(c => c.Serie == serie).MaxAsync(c => (int?)c.Correlativo) ?? 0;
    var comprobante = new Comprobante
    {
        VentaId = venta.Id, Tipo = tipo, Serie = serie,
        Correlativo = maxCorr + 1, EstadoSunat = "pendiente",
    };
    db.Comprobantes.Add(comprobante);
    await db.SaveChangesAsync();

    return Results.Created($"/ventas/{venta.Id}", new
    {
        venta.Id, venta.Total, venta.Subtotal, venta.Igv,
        comprobante = new { comprobante.Tipo, comprobante.Serie, comprobante.Correlativo, comprobante.EstadoSunat }
    });
}).RequireAuthorization();

// ── REPORTES ──────────────────────────────────────────────────────────────────

app.MapGet("/reportes/hoy", async (ClaimsPrincipal claims, AppDbContext db) =>
{
    var eid = EmpresaId(claims);
    var hoy = DateTime.UtcNow.Date; var manana = hoy.AddDays(1);
    var ventas = await db.Ventas
        .Where(v => v.EmpresaId == eid && v.Fecha >= hoy && v.Fecha < manana && v.Estado == "completada")
        .ToListAsync();
    var top = await db.DetallesVenta
        .Where(d => d.Venta.EmpresaId == eid && d.Venta.Fecha >= hoy && d.Venta.Fecha < manana)
        .GroupBy(d => d.NombreProducto)
        .Select(g => new { nombre = g.Key, cantidad = g.Sum(x => x.Cantidad), total = g.Sum(x => x.Total) })
        .OrderByDescending(x => x.total).Take(5).ToListAsync();
    return Results.Ok(new
    {
        totalVentas = ventas.Count, totalIngresos = ventas.Sum(v => v.Total),
        totalIgv = ventas.Sum(v => v.Igv), topProductos = top,
    });
}).RequireAuthorization();

app.Run();
