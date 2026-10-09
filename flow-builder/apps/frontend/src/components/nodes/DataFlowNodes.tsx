import type { ReactNode } from 'react';
import { FlowPorts, FlowPortVariant } from './FlowPorts';

type Row = Record<string, string | number>;

function MiniTable({ rows }: { rows?: Row[] }) {
  const list = rows || [];
  if (list.length === 0) {
    return <p className="text-[11px] text-slate-500">The table will appear here after you press Play.</p>;
  }
  const columns = Object.keys(list[0]);
  return (
    <table className="w-full border-collapse text-[10px]">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column} className="border border-slate-200 bg-white px-1 py-0.5 text-left font-semibold">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {list.slice(0, 4).map((row, index) => (
          <tr key={index}>
            {columns.map((column) => (
              <td key={column} className="border border-slate-200 bg-white px-1 py-0.5">
                {String(row[column] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Shell({
  title,
  subtitle,
  tint,
  ports,
  selected,
  runColor,
  children,
}: {
  title: string;
  subtitle: string;
  tint: string;
  ports: FlowPortVariant;
  selected?: boolean;
  runColor?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className="relative min-w-[210px] max-w-[260px] rounded-xl border-2 px-3 py-2 shadow-sm"
      style={{
        background: runColor || tint,
        borderColor: runColor ? '#15803d' : '#334155',
        boxShadow: selected ? '0 0 0 3px rgba(37, 99, 235, 0.35)' : undefined,
      }}
    >
      <FlowPorts variant={ports} />
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mb-1 text-[11px] text-slate-600">{subtitle}</div>
      {children}
      {runColor && <div className="mt-1 text-[10px] font-semibold text-green-800">Played · green</div>}
    </div>
  );
}

export function ImportTableNode({ data, selected }: { data: any; selected?: boolean }) {
  return (
    <Shell
      title={data.label || 'Import table'}
      subtitle={`Table: ${data.tableName || 'Table'}`}
      tint="#dbeafe"
      ports="in-out"
      selected={selected}
      runColor={data.runColor}
    >
      <MiniTable rows={data.rows} />
    </Shell>
  );
}

export function FilterNode({ data, selected }: { data: any; selected?: boolean }) {
  return (
    <Shell
      title={data.label || 'Filter'}
      subtitle={`Keep 1 row where ${data.column || 'column'} = ${data.value || ''}`}
      tint="#fef3c7"
      ports="in-out"
      selected={selected}
      runColor={data.runColor}
    >
      <MiniTable rows={data.previewRows} />
    </Shell>
  );
}

export function JoinNode({ data, selected }: { data: any; selected?: boolean }) {
  return (
    <Shell
      title={data.label || 'Join'}
      subtitle={`Match ${data.leftKey || 'id'} with ${data.rightKey || 'customerId'}`}
      tint="#ede9fe"
      ports="join"
      selected={selected}
      runColor={data.runColor}
    >
      <MiniTable rows={data.previewRows} />
    </Shell>
  );
}

export function DisplayNode({ data, selected }: { data: any; selected?: boolean }) {
  return (
    <Shell
      title={data.label || 'Display'}
      subtitle="Shows the table that arrived here"
      tint="#ccfbf1"
      ports="in"
      selected={selected}
      runColor={data.runColor}
    >
      <MiniTable rows={data.previewRows} />
    </Shell>
  );
}
