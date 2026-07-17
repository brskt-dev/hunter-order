using HunterOrder.Modules.Accounts;
using HunterOrder.Modules.Administration;
using HunterOrder.Modules.Characters;
using HunterOrder.Modules.Chat;
using HunterOrder.Modules.Clans;
using HunterOrder.Modules.Combat;
using HunterOrder.Modules.Gathering;
using HunterOrder.Modules.Identity;
using HunterOrder.Modules.Inventory;
using HunterOrder.Modules.Movement;
using HunterOrder.Modules.Simulation;
using HunterOrder.Modules.World;
using HunterOrder.SharedKernel.Modules;

namespace HunterOrder.Bootstrap;

/// <summary>
/// The composition root's explicit list of modules. Adding a module means adding
/// its project reference and one entry here — kept explicit (no reflection) for
/// clarity and predictable ordering.
/// </summary>
internal static class ModuleCatalog
{
    public static IReadOnlyList<IModule> Modules { get; } =
    [
        new IdentityModule(),
        new AccountsModule(),
        new CharactersModule(),
        new WorldModule(),
        new SimulationModule(),
        new MovementModule(),
        new CombatModule(),
        new InventoryModule(),
        new GatheringModule(),
        new ClansModule(),
        new ChatModule(),
        new AdministrationModule(),
    ];
}
