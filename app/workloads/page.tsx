"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import WorkloadTable from "@/components/workload/WorkloadTable";
import { Workload } from "@/types";

export default function WorkloadsPage() {
  const [workloads, setWorkloads] = useState<Workload[]>([]);

  useEffect(() => {
    const load = () =>
      fetch("/api/workloads").then((r) => r.json()).then((d) => setWorkloads(d.workloads));
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <PageHeader title="Workloads" subtitle={`${workloads.length} tracked · updated every 3s`} />
      <div className="p-8">
        <WorkloadTable workloads={workloads} />
      </div>
    </div>
  );
}
