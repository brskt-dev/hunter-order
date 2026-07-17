using HunterOrder.SharedKernel.Modules;

namespace HunterOrder.Api.Modules;

/// <summary>Holds the ordered set of modules composed into the running host.</summary>
public sealed class ModuleRegistry(IReadOnlyList<IModule> modules)
{
    public IReadOnlyList<IModule> Modules { get; } = modules;
}
