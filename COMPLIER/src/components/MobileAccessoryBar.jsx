import React from 'react';
import { Undo2, Redo2, CornerDownLeft, ChevronRight } from 'lucide-react';

export default function MobileAccessoryBar({ onInsertText, onUndo, onRedo, onEnter }) {
  const symbolList = [
    { label: 'Tab', insert: '    ' },
    { label: '( )', insert: '()' },
    { label: '{ }', insert: '{}' },
    { label: '[ ]', insert: '[]' },
    { label: '" "', insert: '""' },
    { label: "' '", insert: "''" },
    { label: ';', insert: ';' },
    { label: ':', insert: ':' },
    { label: '=', insert: '=' },
    { label: '==', insert: ' == ' },
    { label: '!=', insert: ' != ' },
    { label: '<', insert: '<' },
    { label: '>', insert: '>' },
    { label: '<=', insert: ' <= ' },
    { label: '>=', insert: ' >= ' },
    { label: '+', insert: '+' },
    { label: '-', insert: '-' },
    { label: '*', insert: '*' },
    { label: '/', insert: '/' },
    { label: '%', insert: '%' },
    { label: '&&', insert: ' && ' },
    { label: '||', insert: ' || ' },
    { label: '!', insert: '!' },
    { label: ',', insert: ',' },
    { label: '.', insert: '.' },
    { label: '_', insert: '_' },
    { label: '#', insert: '#' },
    { label: '//', insert: '// ' }
  ];

  return (
    <div className="mobile-accessory-bar" role="toolbar" aria-label="Quick code symbols toolbar">
      {/* Undo & Redo Quick Actions */}
      <div className="accessory-fixed-group">
        <button
          type="button"
          className="accessory-btn action-btn"
          onClick={onUndo}
          title="Undo"
          aria-label="Undo code edit"
        >
          <Undo2 size={14} />
        </button>
        <button
          type="button"
          className="accessory-btn action-btn"
          onClick={onRedo}
          title="Redo"
          aria-label="Redo code edit"
        >
          <Redo2 size={14} />
        </button>
      </div>

      <div className="accessory-divider" />

      {/* Horizontally scrollable code symbols */}
      <div className="accessory-scroll-container">
        {symbolList.map((item, idx) => (
          <button
            key={idx}
            type="button"
            className="accessory-btn symbol-btn"
            onClick={() => onInsertText(item.insert)}
            title={`Insert ${item.label}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="accessory-divider" />

      {/* Enter / Linebreak Key */}
      <div className="accessory-fixed-group">
        <button
          type="button"
          className="accessory-btn action-btn enter-btn"
          onClick={onEnter}
          title="Insert New Line"
          aria-label="Insert New Line"
        >
          <CornerDownLeft size={13} />
        </button>
      </div>
    </div>
  );
}
