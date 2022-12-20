import "./App.css";
import React, {
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useState,
} from "react";
import { Editor, Transforms, Range, createEditor, Descendant } from "slate";
import { withHistory } from "slate-history";
import { Slate, Editable, ReactEditor, withReact } from "slate-react";
import Mention from "./Components/Mentions";
import Portal from "./Components/Portal";
import columns from "./columns";
import functions from "./functions";
import { v4 as uuidv4 } from "uuid";
import { useFormik } from "formik";

function App() {
  const ref = useRef();
  const [target, setTarget] = useState();
  const [index, setIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [usedColumns, setUsedColumns] = useState([]);
  const [usedGroupByColumns, setUsedGroupByColumns] = useState([]);
  const renderElement = useCallback((props) => <Element {...props} />, []);
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);

  useEffect(() => {
    console.log(
      "Used Columns: ",
      usedColumns,
      "Used Group By columns: ",
      usedGroupByColumns
    );
  }, [usedColumns, usedGroupByColumns]);

  const formik = useFormik({
    initialValues: {
      functionColumns: [],
    },
  });

  const withMentions = (editor) => {
    const { isInline, isVoid, markableVoid } = editor;

    editor.isInline = (element) => {
      return element.type === "mention" ? true : isInline(element);
    };

    editor.isVoid = (element) => {
      return element.type === "mention" ? true : isVoid(element);
    };

    editor.markableVoid = (element) => {
      return element.type === "mention" || markableVoid(element);
    };

    return editor;
  };

  const editor = useMemo(
    () => withMentions(withReact(withHistory(createEditor()))),
    []
  );

  const functionChars = functions
    .filter((c) => c.name.toLowerCase().startsWith(search.toLowerCase()))
    .slice(0, 10);

  const columnChars = columns
    .filter((c) =>
      c.Display.toLowerCase().startsWith(search.toLowerCase().slice(1))
    )
    .slice(0, 10);

  const onKeyDown = useCallback(
    (event) => {
      if (target && functionChars.length > 0) {
        switch (event.key) {
          case "ArrowDown":
            event.preventDefault();
            const prevIndex = index >= functionChars.length - 1 ? 0 : index + 1;
            setIndex(prevIndex);
            break;
          case "ArrowUp":
            event.preventDefault();
            const nextIndex = index <= 0 ? functionChars.length - 1 : index - 1;
            setIndex(nextIndex);
            break;
          case "Tab":
          case "Enter":
            event.preventDefault();
            Transforms.select(editor, target);
            insertMention(editor, { ...functionChars[index], key: uuidv4() });
            setTarget(null);
            break;
          case "Escape":
            event.preventDefault();
            setTarget(null);
            break;
        }
      } else if (target && columnChars.length > 0) {
        switch (event.key) {
          case "ArrowDown":
            event.preventDefault();
            const prevIndex = index >= columnChars.length - 1 ? 0 : index + 1;
            setIndex(prevIndex);
            break;
          case "ArrowUp":
            event.preventDefault();
            const nextIndex = index <= 0 ? columnChars.length - 1 : index - 1;
            setIndex(nextIndex);
            break;
          case "Tab":
          case "Enter":
            event.preventDefault();
            Transforms.select(editor, target);
            insertMention(editor, columnChars[index]);
            setTarget(null);
            break;
          case "Escape":
            event.preventDefault();
            setTarget(null);
            break;
        }
      }
    },
    [index, search, target]
  );

  useEffect(() => {
    if (target && (columnChars.length > 0 || functionChars.length > 0)) {
      const el = ref.current;
      const domRange = ReactEditor.toDOMRange(editor, target);
      const rect = domRange.getBoundingClientRect();
      el.style.top = `${rect.top + window.pageYOffset + 24}px`;
      el.style.left = `${rect.left + window.pageXOffset}px`;
    }
    console.log(functionChars);
  }, [functionChars.length, columnChars.length, editor, index, search, target]);

  const initialValue = [
    {
      type: "paragraph",
      children: [
        {
          text: "This example shows how calculation UI will work ",
        },
      ],
    },
  ];

  const insertMention = (editor, character) => {
    const mention = {
      type: "mention",
      character,
      children: [{ text: "" }],
    };
    Transforms.insertNodes(editor, mention);
    Transforms.move(editor);
  };

  const Element = (props) => {
    const { attributes, children, element } = props;
    switch (element.type) {
      case "mention":
        return (
          <Mention
            {...props}
            formik={formik}
            setUsedColumns={setUsedColumns}
            usedColumns={usedColumns}
            ssetUsedGroupByColumns={setUsedGroupByColumns}
            usedGroupByColumns={usedGroupByColumns}
          />
        );
      default:
        return <p {...attributes}>{children}</p>;
    }
  };

  const Leaf = ({ attributes, children, leaf }) => {
    if (leaf.bold) {
      children = <strong>{children}</strong>;
    }

    if (leaf.code) {
      children = <code>{children}</code>;
    }

    if (leaf.italic) {
      children = <em>{children}</em>;
    }

    if (leaf.underline) {
      children = <u>{children}</u>;
    }

    return <span {...attributes}>{children}</span>;
  };

  return (
    <div className="App">
      <Slate
        editor={editor}
        value={initialValue}
        onChange={(value) => {
          const { selection } = editor;

          if (selection && Range.isCollapsed(selection)) {
            const [start] = Range.edges(selection);
            const wordBefore = Editor.before(editor, start, { unit: "word" });
            const before = wordBefore && Editor.before(editor, wordBefore);
            const beforeRange = before && Editor.range(editor, before, start);
            const beforeText =
              beforeRange && Editor.string(editor, beforeRange);
            const beforeMatch = beforeText && beforeText.match(/^@(\w+)$/);
            const beforeColumnMatch =
              beforeText && beforeText.match(/^\s[a-zA-Z]+$/);
            const after = Editor.after(editor, start);
            const afterRange = Editor.range(editor, start, after);
            const afterText = Editor.string(editor, afterRange);
            const afterMatch = afterText.match(/^(\s|$)/);

            if (beforeMatch && afterMatch) {
              setTarget(beforeRange);
              setSearch(beforeMatch[1]);
              setIndex(0);
              return;
            } else if (beforeColumnMatch && afterMatch) {
              setTarget(beforeRange);
              setSearch(beforeColumnMatch[0]);
              setIndex(0);
              return;
            }
          }

          setTarget(null);
          console.log(value);
        }}
      >
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={onKeyDown}
          placeholder="Enter some text..."
        />
        {target && (columnChars.length > 0 || functionChars.length > 0) && (
          <Portal>
            <div
              ref={ref}
              style={{
                top: "-9999px",
                left: "-9999px",
                position: "absolute",
                zIndex: 1,
                padding: "3px",
                background: "white",
                borderRadius: "4px",
                boxShadow: "0 1px 5px rgba(0,0,0,.2)",
              }}
              data-cy="mentions-portal"
            >
              {functionChars.length > 0
                ? functionChars.map((char, i) => (
                    <div
                      key={char}
                      style={{
                        padding: "1px 3px",
                        borderRadius: "3px",
                        background: i === index ? "#B4D5FF" : "transparent",
                      }}
                    >
                      {char.name}
                    </div>
                  ))
                : columnChars.length > 0
                ? columnChars.map((char, i) => (
                    <div
                      key={char}
                      style={{
                        padding: "1px 3px",
                        borderRadius: "3px",
                        background: i === index ? "#B4D5FF" : "transparent",
                      }}
                    >
                      {char.Display}
                    </div>
                  ))
                : null}
            </div>
          </Portal>
        )}
      </Slate>
    </div>
  );
}

export default App;
