namespace PosApi;

/// <summary>
/// Default product catalog seeded for every new Empresa on registration.
/// Prices are Lima retail market averages (June 2026).
/// Sources: EMMSA Gran Mercado Mayorista, Mercado Grau, Mercado El Bosque, MIDAGRI.
/// IGV rules per SUNAT: fresh produce, meats, eggs, basic staples = exonerado.
/// </summary>
public static class ProductosSeed
{
    public static List<Producto> GetDefaultProductos(Guid empresaId)
    {
        var productos = new List<(string Nombre, string Categoria, string Unidad, decimal Precio, bool Igv)>
        {
            // ── FRUTAS ────────────────────────────────────────────────────────
            ("Sandía",              "Frutas", "kg",  1.50m,  false),
            ("Melón",               "Frutas", "kg",  2.00m,  false),
            ("Naranja Valencia",    "Frutas", "kg",  2.50m,  false),
            ("Mandarina Satsuma",   "Frutas", "kg",  3.00m,  false),
            ("Palta Criolla",       "Frutas", "kg",  4.00m,  false),
            ("Papaya",              "Frutas", "kg",  4.00m,  false),
            ("Piña Hawaiana",       "Frutas", "kg",  3.50m,  false),
            ("Mango Kent",          "Frutas", "kg",  4.00m,  false),
            ("Manzana Israel",      "Frutas", "kg",  5.00m,  false),
            ("Manzana Delicia",     "Frutas", "kg",  6.00m,  false),
            ("Granadilla",          "Frutas", "kg",  5.00m,  false),
            ("Uva Italia",          "Frutas", "kg",  6.00m,  false),
            ("Uva Red Globe",       "Frutas", "kg",  7.00m,  false),
            ("Fresa",               "Frutas", "kg",  7.00m,  false),
            ("Plátano de Isla",     "Frutas", "kg",  2.00m,  false),
            ("Plátano de Seda",     "Frutas", "kg",  2.50m,  false),
            ("Plátano Bellaco",     "Frutas", "kg",  3.00m,  false),
            ("Limón",               "Frutas", "kg",  3.00m,  false),
            ("Tuna Morada",         "Frutas", "kg",  3.50m,  false),
            ("Maracuyá",            "Frutas", "kg",  4.00m,  false),
            ("Lúcuma",              "Frutas", "kg",  6.00m,  false),
            ("Chirimoya",           "Frutas", "kg",  7.00m,  false),
            ("Aguaymanto",          "Frutas", "kg",  8.00m,  false),
            ("Camu Camu",           "Frutas", "kg", 10.00m,  false),
            ("Durazno",             "Frutas", "kg",  5.00m,  false),
            ("Pera",                "Frutas", "kg",  5.00m,  false),
            ("Membrillo",           "Frutas", "kg",  4.00m,  false),
            ("Pepino Dulce",        "Frutas", "kg",  2.50m,  false),

            // ── VERDURAS ─────────────────────────────────────────────────────
            ("Tomate",              "Verduras", "kg",  3.50m,  false),
            ("Cebolla Roja",        "Verduras", "kg",  2.50m,  false),
            ("Cebolla Blanca",      "Verduras", "kg",  2.50m,  false),
            ("Cebolla China",       "Verduras", "pz",  1.00m,  false),
            ("Zanahoria",           "Verduras", "kg",  2.00m,  false),
            ("Lechuga",             "Verduras", "pz",  1.50m,  false),
            ("Lechuga Hidropónica", "Verduras", "pz",  2.00m,  false),
            ("Espinaca",            "Verduras", "pz",  1.00m,  false),
            ("Brócoli",             "Verduras", "kg",  4.00m,  false),
            ("Coliflor",            "Verduras", "pz",  3.00m,  false),
            ("Pepino",              "Verduras", "pz",  1.00m,  false),
            ("Ají Amarillo",        "Verduras", "kg",  6.00m,  false),
            ("Ají Panca",           "Verduras", "kg",  8.00m,  false),
            ("Rocoto",              "Verduras", "kg",  6.00m,  false),
            ("Pimiento Rojo",       "Verduras", "kg",  6.00m,  false),
            ("Zapallo Macre",       "Verduras", "kg",  3.00m,  false),
            ("Zapallo Loche",       "Verduras", "kg",  4.00m,  false),
            ("Vainita",             "Verduras", "kg",  4.00m,  false),
            ("Choclo",              "Verduras", "pz",  1.00m,  false),
            ("Espárrago",           "Verduras", "kg", 10.00m,  false),
            ("Apio",                "Verduras", "pz",  1.00m,  false),
            ("Perejil",             "Verduras", "pz",  0.50m,  false),
            ("Culantro",            "Verduras", "pz",  0.50m,  false),
            ("Betarraga",           "Verduras", "kg",  2.50m,  false),
            ("Rabanito",            "Verduras", "pz",  1.00m,  false),
            ("Nabo",                "Verduras", "kg",  2.00m,  false),
            ("Haba Verde",          "Verduras", "kg",  3.50m,  false),
            ("Vainilla Verde",      "Verduras", "kg",  5.00m,  false),
            ("Ajo",                 "Verduras", "kg", 12.00m,  false),
            ("Poro",                "Verduras", "pz",  1.00m,  false),
            ("Kion (Jengibre)",     "Verduras", "kg", 10.00m,  false),
            ("Cúrcuma",             "Verduras", "kg", 12.00m,  false),
            ("Acelga",              "Verduras", "pz",  1.00m,  false),
            ("Col (Repollo)",       "Verduras", "pz",  2.00m,  false),

            // ── TUBÉRCULOS ───────────────────────────────────────────────────
            ("Papa Blanca",         "Tubérculos", "kg",  2.50m,  false),
            ("Papa Amarilla",       "Tubérculos", "kg",  3.50m,  false),
            ("Papa Huayro",         "Tubérculos", "kg",  4.00m,  false),
            ("Papa Yungay",         "Tubérculos", "kg",  2.50m,  false),
            ("Papa Negra",          "Tubérculos", "kg",  4.00m,  false),
            ("Camote Amarillo",     "Tubérculos", "kg",  3.00m,  false),
            ("Camote Morado",       "Tubérculos", "kg",  4.00m,  false),
            ("Yuca Amarilla",       "Tubérculos", "kg",  3.50m,  false),
            ("Olluco",              "Tubérculos", "kg",  3.50m,  false),
            ("Oca",                 "Tubérculos", "kg",  4.00m,  false),
            ("Mashua",              "Tubérculos", "kg",  4.00m,  false),
            ("Maca",                "Tubérculos", "kg", 12.00m,  false),

            // ── CARNES Y AVES ────────────────────────────────────────────────
            ("Pollo Entero",        "Carnes", "kg",  9.80m,  false),
            ("Pechuga de Pollo",    "Carnes", "kg", 14.00m,  false),
            ("Pierna de Pollo",     "Carnes", "kg", 11.00m,  false),
            ("Ala de Pollo",        "Carnes", "kg",  9.00m,  false),
            ("Carne de Res",        "Carnes", "kg", 22.00m,  false),
            ("Bistec de Res",       "Carnes", "kg", 28.00m,  false),
            ("Carne Molida",        "Carnes", "kg", 20.00m,  false),
            ("Hígado de Res",       "Carnes", "kg", 12.00m,  false),
            ("Cerdo (trozos)",      "Carnes", "kg", 17.00m,  false),
            ("Chuleta de Cerdo",    "Carnes", "kg", 18.00m,  false),
            ("Panceta de Cerdo",    "Carnes", "kg", 28.00m,  false),
            ("Costillar de Cerdo",  "Carnes", "kg", 30.00m,  false),
            ("Pavo",                "Carnes", "kg", 27.00m,  false),
            ("Cuy Entero",          "Carnes", "pz", 35.00m,  false),

            // ── PESCADOS Y MARISCOS ──────────────────────────────────────────
            ("Jurel",               "Pescados", "kg",  9.00m,  false),
            ("Caballa",             "Pescados", "kg",  8.00m,  false),
            ("Trucha",              "Pescados", "kg", 14.00m,  false),
            ("Tilapia",             "Pescados", "kg", 12.00m,  false),
            ("Bonito",              "Pescados", "kg", 10.00m,  false),
            ("Lenguado",            "Pescados", "kg", 28.00m,  false),
            ("Cojinova",            "Pescados", "kg", 16.00m,  false),
            ("Pota (anillas)",      "Pescados", "kg",  8.00m,  false),
            ("Camarones",           "Pescados", "kg", 45.00m,  false),
            ("Concha de Abanico",   "Pescados", "kg", 20.00m,  false),

            // ── LÁCTEOS Y HUEVOS ─────────────────────────────────────────────
            ("Huevo",               "Lácteos y Huevos", "pz",  0.55m,  false),
            ("Leche Fresca",        "Lácteos y Huevos", "L",   3.50m,  false),
            ("Queso Fresco",        "Lácteos y Huevos", "kg",  20.00m, false),
            ("Mantequilla",         "Lácteos y Huevos", "kg",  22.00m, true),
            ("Yogurt Natural",      "Lácteos y Huevos", "L",   5.00m,  true),
            ("Crema de Leche",      "Lácteos y Huevos", "L",   8.00m,  true),

            // ── ABARROTES A GRANEL ───────────────────────────────────────────
            ("Arroz Corriente",     "Abarrotes", "kg",  3.50m,  false),
            ("Arroz Extra",         "Abarrotes", "kg",  4.50m,  false),
            ("Azúcar Blanca",       "Abarrotes", "kg",  3.50m,  false),
            ("Azúcar Rubia",        "Abarrotes", "kg",  3.00m,  false),
            ("Harina de Trigo",     "Abarrotes", "kg",  4.00m,  false),
            ("Frijol Canario",      "Abarrotes", "kg",  6.00m,  false),
            ("Frijol Negro",        "Abarrotes", "kg",  6.50m,  false),
            ("Lenteja",             "Abarrotes", "kg",  5.00m,  false),
            ("Garbanzo",            "Abarrotes", "kg",  6.00m,  false),
            ("Arveja Partida",      "Abarrotes", "kg",  5.00m,  false),
            ("Maíz Morado",         "Abarrotes", "kg",  5.50m,  false),
            ("Maíz Mote",           "Abarrotes", "kg",  4.00m,  false),
            ("Quinua",              "Abarrotes", "kg", 12.00m,  false),
            ("Kiwicha",             "Abarrotes", "kg", 10.00m,  false),
            ("Avena",               "Abarrotes", "kg",  5.00m,  false),
            ("Sal de Cocina",       "Abarrotes", "kg",  1.50m,  false),
            ("Aceite Vegetal",      "Abarrotes", "L",   8.00m,  true),
            ("Vinagre",             "Abarrotes", "L",   4.00m,  true),
            ("Maní",                "Abarrotes", "kg",  8.00m,  false),
            ("Semilla de Chia",     "Abarrotes", "kg", 15.00m,  false),

            // ── PANADERÍA ────────────────────────────────────────────────────
            ("Pan Francés",         "Panadería", "pz",  0.20m,  false),
            ("Pan de Yema",         "Panadería", "pz",  0.50m,  false),
            ("Pan Integral",        "Panadería", "pz",  0.50m,  false),
            ("Pan de Molde",        "Panadería", "pz",  5.00m,  true),
            ("Empanada",            "Panadería", "pz",  2.00m,  false),

            // ── BEBIDAS ──────────────────────────────────────────────────────
            ("Agua de Mesa 625ml",  "Bebidas", "pz",  1.00m,  true),
            ("Agua de Mesa 1L",     "Bebidas", "pz",  1.50m,  true),
            ("Inca Kola 500ml",     "Bebidas", "pz",  2.00m,  true),
            ("Coca-Cola 500ml",     "Bebidas", "pz",  2.00m,  true),
            ("Chicha Morada 1L",    "Bebidas", "pz",  3.50m,  true),
        };

        return productos.Select(p => new Producto
        {
            EmpresaId    = empresaId,
            Nombre       = p.Nombre,
            Categoria    = p.Categoria,
            Unidad       = p.Unidad,
            Precio       = p.Precio,
            AplicaIgv    = p.Igv,
            Stock        = 0,
            ControlStock = false,
            Activo       = true,
        }).ToList();
    }
}
