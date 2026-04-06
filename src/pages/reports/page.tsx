import ModulePage from "../../common/components/modules/ModulePage";
import { OPERATIONS_MOCK } from "../../common/data/operations.mock";

const data = OPERATIONS_MOCK.reports;

export default function ReportsPage() {
  return (
    <ModulePage
      title={data.title}
      description={data.description}
      kpis={data.kpis}
      table={data.table}
      systems={data.systems}
    />
  );
}

