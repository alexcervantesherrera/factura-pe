namespace PosApi;

record RegisterDto(string Ruc, string RazonSocial, string? Direccion,
    string? SolUsuario, string? SolPassword, string NombreAdmin, string Email, string Password);
record LoginDto(string Email, string Password);
record ProductoDto(string? CodigoBarras, string Nombre, string? Categoria, string? ImagenUrl,
    decimal Precio, bool AplicaIgv, int Stock, bool ControlStock, string? Unidad);
record ClienteDto(string TipoDoc, string NumDoc, string Nombre, string? Email, string? Telefono);
record VentaItemDto(Guid ProductoId, decimal Cantidad, decimal? PrecioOverride);
record VentaDto(List<VentaItemDto> Items, Guid? ClienteId, string? TipoComprobante);

class OFFResponse { public int Status { get; set; } public OFFProduct? Product { get; set; } }
class OFFProduct
{
    [System.Text.Json.Serialization.JsonPropertyName("product_name")]
    public string? ProductName { get; set; }
    [System.Text.Json.Serialization.JsonPropertyName("image_front_small_url")]
    public string? ImageUrl { get; set; }
    [System.Text.Json.Serialization.JsonPropertyName("categories_tags")]
    public List<string>? Categories { get; set; }
}
