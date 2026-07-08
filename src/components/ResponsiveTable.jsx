import { RiskBadge } from './RiskBadge.jsx';
import { StatusBadge } from './StatusBadge.jsx';

export function ResponsiveTable({ columns, rows }) {
  return (
    <div className="responsive-table" role="region" aria-label="Market data">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join('-')}>
              {row.map((cell, index) => (
                <td key={`${cell}-${index}`} data-label={columns[index]}>
                  {columns[index] === 'Risk' ? (
                    <RiskBadge level={cell} />
                  ) : columns[index] === 'Status' ? (
                    <StatusBadge status={cell} tone={cell.includes('Action') ? 'amber' : 'green'} />
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
