import { type Component, createSignal, createMemo, Show, For } from 'solid-js';

interface JsonViewerProps {
  data: any;
  keyColor?: string;
  valueColor?: string;
  initialDepth?: number;
}

interface TreeNodeProps {
  keyName: string | number | null;
  value: any;
  depth: number;
  expanded: boolean;
  onToggle: () => void;
  keyColor?: string;
  valueColor?: string;
}

const TreeNode: Component<TreeNodeProps> = (props) => {
  const isObject = (val: any) => val !== null && typeof val === 'object';
  const isArray = (val: any) => Array.isArray(val);
  
  const hasChildren = () => isObject(props.value) && Object.keys(props.value).length > 0;
  
  const getValuePreview = () => {
    if (isArray(props.value)) {
      return `Array(${props.value.length})`;
    }
    if (isObject(props.value)) {
      const keys = Object.keys(props.value);
      if (keys.length === 0) return '{}';
      return `{${keys.length} ${keys.length === 1 ? 'key' : 'keys'}}`;
    }
    return null;
  };

  const formatValue = () => {
    if (props.value === null) return 'null';
    if (typeof props.value === 'string') return `"${props.value}"`;
    if (typeof props.value === 'number') return props.value.toString();
    if (typeof props.value === 'boolean') return props.value.toString();
    return '';
  };

  const getValueClass = () => {
    if (props.value === null) return 'text-gray-400 italic';
    if (typeof props.value === 'string') return 'text-green-600';
    if (typeof props.value === 'number') return 'text-blue-600';
    if (typeof props.value === 'boolean') return 'text-purple-600';
    return '';
  };

  const getChildren = () => {
    if (isArray(props.value)) {
      return props.value.map((item: any, index: number) => ({
        key: index,
        value: item,
      }));
    }
    if (isObject(props.value)) {
      return Object.entries(props.value).map(([key, val]) => ({
        key,
        value: val,
      }));
    }
    return [];
  };

  const handleToggle = (e: Event) => {
    e.stopPropagation();
    props.onToggle();
  };

  return (
    <div>
      <div 
        class="flex items-start group hover:bg-gray-50 px-2 py-1 cursor-pointer"
        onClick={handleToggle}
      >
        <div class="flex items-center">
          {hasChildren() && (
            <button
              onClick={handleToggle}
              class="mr-1 w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors focus:outline-none flex-shrink-0"
              aria-label={props.expanded ? 'Collapse' : 'Expand'}
            >
              {props.expanded ? (
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          )}
          
          {!hasChildren() && <div class="w-6 flex-shrink-0"></div>}
          
          <div class="flex flex-wrap items-center gap-1">
            {props.keyName !== null && (
              <span class="font-semibold" style={{ color: props.keyColor || '#9333ea' }}>
                {props.keyName}:
              </span>
            )}
            
            {!hasChildren() && (
              <span class={getValueClass()} style={{ color: props.valueColor }}>
                {formatValue()}
              </span>
            )}
            
            {hasChildren() && !props.expanded && (
              <span class="text-gray-400 text-sm ml-1">{getValuePreview()}</span>
            )}
          </div>
        </div>
      </div>
      
      <Show when={hasChildren() && props.expanded}>
        <div class="border-l-2 border-gray-200 ml-2 mt-1">
          <For each={getChildren()}>
            {(item) => (
              <JsonTreeNode
                keyName={item.key}
                value={item.value}
                depth={props.depth + 1}
                keyColor={props.keyColor}
                valueColor={props.valueColor}
                initialDepth={props.depth + 1}
              />
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

const JsonTreeNode: Component<{
  keyName: string | number;
  value: any;
  depth: number;
  initialDepth?: number;
  keyColor?: string;
  valueColor?: string;
}> = (props) => {
  // Автоматически открываем первые 2 уровня глубины
  const [expanded, setExpanded] = createSignal(props.depth < 2);

  const handleToggle = () => {
    setExpanded(!expanded());
  };

  return (
    <TreeNode
      keyName={props.keyName}
      value={props.value}
      depth={props.depth}
      expanded={expanded()}
      onToggle={handleToggle}
      keyColor={props.keyColor}
      valueColor={props.valueColor}
    />
  );
};

export const JsonViewer: Component<JsonViewerProps> = (props) => {
  const parsedData = createMemo(() => {
    if (typeof props.data === 'string') {
      try {
        return JSON.parse(props.data);
      } catch {
        return props.data;
      }
    }
    return props.data;
  });

  const isValidJson = createMemo(() => {
    const data = parsedData();
    return data !== null && typeof data === 'object';
  });

  // Простая рекурсивная отрисовка дерева с индивидуальным состоянием
  const RecursiveTree: Component<{ 
    data: any; 
    keyName?: string | number | null;
    depth?: number;
  }> = (treeProps) => {
    const currentDepth = treeProps.depth || 0;
    const [expanded, setExpanded] = createSignal(currentDepth < 2);
    const hasChildren = () => {
      const val = treeProps.data;
      return val !== null && typeof val === 'object' && Object.keys(val).length > 0;
    };
    
    const handleToggle = (e: Event) => {
      e.stopPropagation();
      setExpanded(!expanded());
    };
    
    const getPreview = () => {
      const val = treeProps.data;
      if (Array.isArray(val)) {
        return `Array(${val.length})`;
      }
      if (val !== null && typeof val === 'object') {
        const keys = Object.keys(val);
        if (keys.length === 0) return '{}';
        return `{${keys.length} ${keys.length === 1 ? 'key' : 'keys'}}`;
      }
      return null;
    };
    
    const formatValue = () => {
      const val = treeProps.data;
      if (val === null) return 'null';
      if (typeof val === 'string') return `"${val}"`;
      if (typeof val === 'number') return val.toString();
      if (typeof val === 'boolean') return val.toString();
      return '';
    };
    
    const getValueClass = () => {
      const val = treeProps.data;
      if (val === null) return 'text-gray-400 italic';
      if (typeof val === 'string') return 'text-green-600';
      if (typeof val === 'number') return 'text-blue-600';
      if (typeof val === 'boolean') return 'text-purple-600';
      return '';
    };
    
    if (!hasChildren()) {
      return (
        <div class="flex items-center py-0.5">
          <div class="w-6 flex-shrink-0"></div>
          {treeProps.keyName !== null && treeProps.keyName !== undefined && (
            <span class="font-semibold" style={{ color: props.keyColor || '#9333ea' }}>
              {treeProps.keyName}:
            </span>
          )}
          <span class={`ml-1 ${getValueClass()}`} style={{ color: props.valueColor }}>
            {formatValue()}
          </span>
        </div>
      );
    }
    
    const getChildren = () => {
      const val = treeProps.data;
      if (Array.isArray(val)) {
        return val.map((item, idx) => ({ key: idx, value: item }));
      }
      return Object.entries(val).map(([key, val]) => ({ key, value: val }));
    };
    
    return (
      <div>
        <div 
          class="flex items-center group hover:bg-gray-50 px-2 py-1 cursor-pointer"
          onClick={handleToggle}
        >
          <button
            onClick={handleToggle}
            class="mr-1 w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors focus:outline-none flex-shrink-0"
          >
            {expanded() ? (
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
          
          {treeProps.keyName !== null && treeProps.keyName !== undefined && (
            <span class="font-semibold" style={{ color: props.keyColor || '#9333ea' }}>
              {treeProps.keyName}:
            </span>
          )}
          
          {!expanded() && (
            <span class="text-gray-400 text-sm ml-1">{getPreview()}</span>
          )}
        </div>
        
        <Show when={expanded()}>
          <div class="border-l-2 border-gray-200 ml-5 pl-2 mt-1">
            <For each={getChildren()}>
              {(item) => (
                <RecursiveTree 
                  data={item.value}
                  keyName={item.key}
                  depth={currentDepth + 1}
                />
              )}
            </For>
          </div>
        </Show>
      </div>
    );
  };

  return (
    <div class="font-mono text-sm bg-white border border-gray-200 overflow-hidden">
      <div class="p-4 overflow-auto max-h-96">
        <Show
          when={isValidJson()}
          fallback={
            <div class="text-red-500">
              ❌ Invalid JSON data
            </div>
          }
        >
          <RecursiveTree data={parsedData()} />
        </Show>
      </div>
    </div>
  );
};