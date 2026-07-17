using HunterOrder.Api;
using HunterOrder.Bootstrap;

var builder = WebApplication.CreateBuilder(args);

builder.AddHunterOrder(ModuleCatalog.Modules);

var app = builder.Build();

app.UseHunterOrder();

app.Logger.LogInformation(
    "Hunter Order server starting in {Environment}",
    app.Environment.EnvironmentName);

app.Run();

/// <summary>Exposed as a public partial so integration tests can host it via WebApplicationFactory.</summary>
public partial class Program;
