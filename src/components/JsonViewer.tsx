import content from '@app/styles/content.module.css';
import jsonStyles from '@app/styles/json.module.css';
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
    if (props.value === null) return jsonStyles.jsonValueNull;
    if (typeof props.value === 'string') return jsonStyles.jsonValueString;
    if (typeof props.value === 'number') return jsonStyles.jsonValueNumber;
    if (typeof props.value === 'boolean') return jsonStyles.jsonValueBoolean;
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
        class={jsonStyles.jsonNode}
        onClick={handleToggle}
      >
        <div class={jsonStyles.jsonNodeInline}>
          {hasChildren() && (
            <button
              onClick={handleToggle}
              class={jsonStyles.jsonToggleButton}
              aria-label={props.expanded ? 'Collapse' : 'Expand'}
            >
              {props.expanded ? (
                <svg class={jsonStyles.jsonToggleIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg class={jsonStyles.jsonToggleIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          )}
          
          {!hasChildren() && <div class={jsonStyles.jsonIndent}></div>}
          
          <div class={jsonStyles.jsonNodeText}>
            {props.keyName !== null && (
              <span class={content.strongText} style={{ color: props.keyColor || '#9333ea' }}>
                {props.keyName}:
              </span>
            )}
            
            {!hasChildren() && (
              <span class={getValueClass()} style={{ color: props.valueColor }}>
                {formatValue()}
              </span>
            )}
            
            {hasChildren() && !props.expanded && (
              <span class={jsonStyles.jsonMeta}>{getValuePreview()}</span>
            )}
          </div>
        </div>
      </div>
      
      <Show when={hasChildren() && props.expanded}>
        <div class={jsonStyles.jsonChildren}>
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
      if (val === null) return jsonStyles.jsonValueNull;
      if (typeof val === 'string') return jsonStyles.jsonValueString;
      if (typeof val === 'number') return jsonStyles.jsonValueNumber;
      if (typeof val === 'boolean') return jsonStyles.jsonValueBoolean;
      return '';
    };
    
    if (!hasChildren()) {
      return (
        <div class={jsonStyles.jsonRow}>
          <div class={jsonStyles.jsonIndent}></div>
          {treeProps.keyName !== null && treeProps.keyName !== undefined && (
            <span class={content.strongText} style={{ color: props.keyColor || '#9333ea' }}>
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
          class={jsonStyles.jsonNode}
          onClick={handleToggle}
        >
          <button
            onClick={handleToggle}
            class={jsonStyles.jsonToggleButton}
          >
            {expanded() ? (
              <svg class={jsonStyles.jsonToggleIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg class={jsonStyles.jsonToggleIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
          
          {treeProps.keyName !== null && treeProps.keyName !== undefined && (
            <span class={content.strongText} style={{ color: props.keyColor || '#9333ea' }}>
              {treeProps.keyName}:
            </span>
          )}
          
          {!expanded() && (
            <span class={jsonStyles.jsonMeta}>{getPreview()}</span>
          )}
        </div>
        
        <Show when={expanded()}>
          <div class={jsonStyles.jsonChildrenNested}>
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
    <div class={jsonStyles.jsonViewer}>
      <div class={jsonStyles.jsonScroll}>
        <Show
          when={isValidJson()}
          fallback={
            <div class={jsonStyles.jsonError}>
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
