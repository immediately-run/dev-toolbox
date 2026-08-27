import type { ToolId } from '../data/tools';
import JsonTool from '../tools/JsonTool';
import RegexTool from '../tools/RegexTool';
import EncodeTool from '../tools/EncodeTool';
import HashTool from '../tools/HashTool';
import DiffTool from '../tools/DiffTool';
import GeneratorsTool from '../tools/GeneratorsTool';
import TextTool from '../tools/TextTool';
import ColorTool from '../tools/ColorTool';
import CharMapTool from '../tools/CharMapTool';

function ToolPane({ id }: { id: ToolId }) {
  switch (id) {
    case 'json':
      return <JsonTool />;
    case 'regex':
      return <RegexTool />;
    case 'encode':
      return <EncodeTool />;
    case 'hash':
      return <HashTool />;
    case 'diff':
      return <DiffTool />;
    case 'generate':
      return <GeneratorsTool />;
    case 'text':
      return <TextTool />;
    case 'color':
      return <ColorTool />;
    case 'chars':
      return <CharMapTool />;
  }
}

export default ToolPane;
