import ResourceTable from '../components/ResourceTable';

export default function Deals() {
  return (
    <ResourceTable
      resource="deals"
      title="Deals"
      columns={[
        { key: 'title', label: 'Title' },
        { key: 'value', label: 'Value' },
        { key: 'currency', label: 'Currency' },
        { key: 'stage', label: 'Stage' },
        { key: 'probability', label: 'Probability %' },
        { key: 'expected_close_date', label: 'Expected Close' },
      ]}
      formFields={[
        { key: 'title', label: 'Title' },
        { key: 'value', label: 'Value', type: 'number' },
        { key: 'currency', label: 'Currency' },
        {
          key: 'stage',
          label: 'Stage',
          type: 'select',
          options: ['prospecting', 'qualification', 'proposal', 'negotiation', 'won', 'lost'],
        },
        { key: 'probability', label: 'Probability %', type: 'number' },
        { key: 'expected_close_date', label: 'Expected Close Date', type: 'date' },
        { key: 'notes', label: 'Notes' },
      ]}
    />
  );
}
