import { useLocation, useNavigate } from 'react-router-dom';
import AssignTeam from './AssignTeam';

export default function AssignEditingTeamPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const clientData = location.state?.clientData;

  console.log("AssignEditingTeamPage mounted. state:", location.state);

  if (!clientData) {
    return <div className="p-10 text-red-500 text-xl font-bold">ERROR: No clientData found in state! State was: {JSON.stringify(location.state)}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Assign Editing Team Page Loaded!</h1>
      <pre className="mb-4 text-xs bg-gray-100 p-2">{JSON.stringify(clientData, null, 2)}</pre>
      <AssignTeam
        client={clientData}
        forceEditingTeamOnly={true}
        onBack={() => navigate(-1)}
        onNext={() => navigate(-1)}
      />
    </div>
  );
}
