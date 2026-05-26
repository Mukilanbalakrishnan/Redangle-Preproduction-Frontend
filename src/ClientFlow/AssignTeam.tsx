import AssignEditingTeam from "./AssignEditingTeam";
import AssignShootTeam from "./AssignShootTeam";
import { useAssignTeamContext } from "./assignTeamShared";

export default function AssignTeam({
  client,
  onNext,
  onBack,
  forceShootTeamOnly = false,
  forceEditingTeamOnly = false,
}: {
  client: { id: string; serialNumber?: string };
  onNext: () => void;
  onBack: () => void;
  forceShootTeamOnly?: boolean;
  forceEditingTeamOnly?: boolean;
}) {
  const actualId = String(client.id);
  const context = useAssignTeamContext(actualId);

  if (context.isLoading) {
    return (
      <div
        className="rounded-[32px] bg-white p-10 shadow-sm"
        style={{ border: "1px solid #E5E7EB" }}
      >
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
          <p className="text-sm" style={{ color: "#6B7280" }}>
            Loading assignment workspace...
          </p>
        </div>
      </div>
    );
  }

  if (forceEditingTeamOnly || (!forceShootTeamOnly && context.currentPhase === "pre_production" && context.preProductionStep === "editing")) {
    return <AssignEditingTeam context={context} onBack={onBack} onNext={onNext} />;
  }

  return (
    <AssignShootTeam
      context={context}
      onBack={onBack}
      onNext={onNext}
      client={client}
      forceShootTeamOnly={forceShootTeamOnly}
    />
  );
}
