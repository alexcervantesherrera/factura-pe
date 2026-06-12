using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddProductUnidad : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Unidad",
                table: "Productos",
                type: "character varying(5)",
                maxLength: 5,
                nullable: false,
                defaultValue: "pz");

            // Back-fill existing products as pieces
            migrationBuilder.Sql("UPDATE \"Productos\" SET \"Unidad\" = 'pz' WHERE \"Unidad\" = ''");

            migrationBuilder.AlterColumn<decimal>(
                name: "Cantidad",
                table: "DetallesVenta",
                type: "numeric(10,3)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Unidad",
                table: "Productos");

            migrationBuilder.AlterColumn<int>(
                name: "Cantidad",
                table: "DetallesVenta",
                type: "integer",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,3)");
        }
    }
}
