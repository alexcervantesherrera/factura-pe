using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PosApi;

public class Empresa
{
    public Guid   Id              { get; set; } = Guid.NewGuid();
    [MaxLength(11)]  public string Ruc            { get; set; } = "";
    [MaxLength(200)] public string RazonSocial    { get; set; } = "";
    [MaxLength(200)] public string Direccion      { get; set; } = "";
    [MaxLength(100)] public string SolUsuario     { get; set; } = "";  // Clave SOL usuario
    [MaxLength(256)] public string SolPasswordEnc { get; set; } = "";  // Clave SOL cifrada
    [MaxLength(500)] public string? LogoUrl       { get; set; }
    public bool   Activa          { get; set; } = true;
    public DateTime CreadoEn      { get; set; } = DateTime.UtcNow;
    public List<Usuario>  Usuarios  { get; set; } = [];
    public List<Producto> Productos { get; set; } = [];
    public List<Cliente>  Clientes  { get; set; } = [];
    public List<Venta>    Ventas    { get; set; } = [];
}

public class Usuario
{
    public Guid   Id          { get; set; } = Guid.NewGuid();
    public Guid   EmpresaId   { get; set; }
    [MaxLength(200)] public string Nombre  { get; set; } = "";
    [MaxLength(200)] public string Email   { get; set; } = "";
    [MaxLength(256)] public string PassHash{ get; set; } = "";
    [MaxLength(20)]  public string Rol     { get; set; } = "cajero"; // admin | cajero
    public DateTime CreadoEn  { get; set; } = DateTime.UtcNow;
    public Empresa  Empresa   { get; set; } = null!;
}

public class Producto
{
    public Guid   Id           { get; set; } = Guid.NewGuid();
    public Guid   EmpresaId    { get; set; }
    [MaxLength(50)]  public string? CodigoBarras { get; set; }
    [MaxLength(300)] public string Nombre        { get; set; } = "";
    [MaxLength(100)] public string? Categoria    { get; set; }
    [MaxLength(500)] public string? ImagenUrl    { get; set; }
    [Column(TypeName="decimal(12,2)")] public decimal Precio { get; set; }
    public bool   AplicaIgv    { get; set; } = true;
    public int    Stock        { get; set; } = 0;
    public bool   ControlStock { get; set; } = false;
    public bool   Activo       { get; set; } = true;
    public DateTime CreadoEn  { get; set; } = DateTime.UtcNow;
    public Empresa Empresa     { get; set; } = null!;
}

public class Cliente
{
    public Guid   Id          { get; set; } = Guid.NewGuid();
    public Guid   EmpresaId   { get; set; }
    [MaxLength(1)]   public string TipoDoc  { get; set; } = "1"; // 1=DNI, 6=RUC, 0=otros
    [MaxLength(20)]  public string NumDoc   { get; set; } = "";
    [MaxLength(300)] public string Nombre   { get; set; } = "";
    [MaxLength(200)] public string? Email   { get; set; }
    [MaxLength(20)]  public string? Telefono{ get; set; }
    public DateTime CreadoEn  { get; set; } = DateTime.UtcNow;
    public Empresa  Empresa   { get; set; } = null!;
}

public class Venta
{
    public Guid   Id           { get; set; } = Guid.NewGuid();
    public Guid   EmpresaId    { get; set; }
    public Guid   UsuarioId    { get; set; }
    public Guid?  ClienteId    { get; set; }
    public DateTime Fecha      { get; set; } = DateTime.UtcNow;
    [Column(TypeName="decimal(12,2)")] public decimal Subtotal { get; set; }
    [Column(TypeName="decimal(12,2)")] public decimal Igv      { get; set; }
    [Column(TypeName="decimal(12,2)")] public decimal Total    { get; set; }
    [MaxLength(20)] public string Estado { get; set; } = "completada"; // completada | anulada
    public Empresa   Empresa  { get; set; } = null!;
    public Usuario   Usuario  { get; set; } = null!;
    public Cliente?  Cliente  { get; set; }
    public List<DetalleVenta> Detalles     { get; set; } = [];
    public Comprobante?       Comprobante  { get; set; }
}

public class DetalleVenta
{
    public Guid   Id               { get; set; } = Guid.NewGuid();
    public Guid   VentaId          { get; set; }
    public Guid   ProductoId       { get; set; }
    [MaxLength(300)] public string NombreProducto { get; set; } = "";
    [Column(TypeName="decimal(12,2)")] public decimal PrecioUnitario { get; set; }
    public int    Cantidad         { get; set; }
    [Column(TypeName="decimal(12,2)")] public decimal Subtotal { get; set; }
    [Column(TypeName="decimal(12,2)")] public decimal Igv      { get; set; }
    [Column(TypeName="decimal(12,2)")] public decimal Total    { get; set; }
    public Venta   Venta    { get; set; } = null!;
    public Producto Producto{ get; set; } = null!;
}

public class Comprobante
{
    public Guid   Id           { get; set; } = Guid.NewGuid();
    public Guid   VentaId      { get; set; }
    [MaxLength(2)]   public string Tipo        { get; set; } = "03"; // 01=factura, 03=boleta
    [MaxLength(4)]   public string Serie       { get; set; } = "B001";
    public int    Correlativo  { get; set; }
    [MaxLength(20)]  public string EstadoSunat { get; set; } = "pendiente"; // pendiente|aceptado|rechazado
    public string? XmlContent  { get; set; }
    public string? CdrContent  { get; set; }
    public string? PdfBase64   { get; set; }
    public DateTime EmitidoEn  { get; set; } = DateTime.UtcNow;
    public Venta   Venta       { get; set; } = null!;
}
