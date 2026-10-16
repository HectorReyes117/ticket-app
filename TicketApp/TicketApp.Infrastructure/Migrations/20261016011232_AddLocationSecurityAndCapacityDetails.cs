using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TicketApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLocationSecurityAndCapacityDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AvailableFloors",
                table: "Locations",
                type: "nvarchar(250)",
                maxLength: 250,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EstimatedStaffCapacity",
                table: "Locations",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IpGuardExtension",
                table: "Locations",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SecurityNotes",
                table: "Locations",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvailableFloors",
                table: "Locations");

            migrationBuilder.DropColumn(
                name: "EstimatedStaffCapacity",
                table: "Locations");

            migrationBuilder.DropColumn(
                name: "IpGuardExtension",
                table: "Locations");

            migrationBuilder.DropColumn(
                name: "SecurityNotes",
                table: "Locations");
        }
    }
}
