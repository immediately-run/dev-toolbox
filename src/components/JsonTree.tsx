import JsonTreeNode from './JsonTreeNode';

function JsonTree({ value }: { value: unknown }) {
  return (
    <div className="tree mono">
      <JsonTreeNode name={null} value={value} depth={0} last />
    </div>
  );
}

export default JsonTree;
