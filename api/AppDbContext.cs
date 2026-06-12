using Microsoft.EntityFrameworkCore;

namespace PosApi;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Empresa>     Empresas     => Set<Empresa>();
    public DbSet<Usuario>     Usuarios     => Set<Usuario>();
    public DbSet<Producto>    Productos    => Set<Producto>();
    public DbSet<Cliente>     Clientes     => Set<Cliente>();
    public DbSet<Venta>       Ventas       => Set<Venta>();
    public DbSet<DetalleVenta>DetallesVenta=> Set<DetalleVenta>();
    public DbSet<Comprobante> Comprobantes => Set<Comprobante>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Empresa>().HasIndex(e => e.Ruc).IsUnique();
        b.Entity<Usuario>().HasIndex(u => u.Email).IsUnique();
        b.Entity<Producto>().HasIndex(p => new { p.EmpresaId, p.CodigoBarras });
        b.Entity<Comprobante>().HasIndex(c => new { c.VentaId }).IsUnique();
        b.Entity<Comprobante>().HasIndex(c => new { c.Serie, c.Correlativo });
    }
}
