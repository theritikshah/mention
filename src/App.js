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
import * as Yup from "yup";

function App() {
  const ref = useRef();
  const [target, setTarget] = useState();
  const [index, setIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [columnSearch, setColumnSearch] = useState("");
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

  function functionToString(value, key) {
    let column, groupColumn;

    for (let obj of usedGroupByColumns) {
      if (obj.key === key) {
        groupColumn = obj.name;
      }
    }

    for (let obj of usedColumns) {
      if (obj.key == key) {
        column = obj.name;
      }
    }

    if (column && groupColumn) {
      return `${column}.groupby(${groupColumn}).transform("${value}")`;
    }

    if (column) {
      return `${column}.${value}()`;
    }
  }
  const getAttributes = (key) => {
    let column, groupColumn;

    for (let obj of usedGroupByColumns) {
      if (obj.key === key) {
        groupColumn = obj.name;
      }
    }

    for (let obj of usedColumns) {
      if (obj.key == key) {
        column = obj.name;
      }
    }
    return [column, groupColumn]
  }
  const formik = useFormik({
    initialValues: {
      functionColumns: [],
    },
    validationSchema: Yup.object().shape({
      functionColumns: Yup.array().min(1, "Formula is required").test("functionColumns", "Enter a Valid expression", (value, index) => {
        if (value.length === 1) {
          return false;
        }
        //formula starts with operator
        if (value[0]?.type === "operator") return false;

        // formula ends with operator or open parenthesis
        if ("+-*/(".includes(value[value.length - 1]?.val)) return false;


        // Check for the left and right of operator and two consecutive parenthese
        for (let val = 0; val < value.length - 1; val++) {
          if (value[val]?.val === "(" && value[val + 1]?.val === ")") return false;

          if ("+-*/".includes(value[val]?.val)) {
            if (
              "*/(".includes(value[val - 1]?.val) ||
              "+-*/)".includes(value[val + 1]?.val)
            ) {
              return false;
            }
          }
        }
        return true;
      })
        // Testing for 2 consecutive operators/constant
        .test(
          "functionColumns",
          "No two constants can be present together",
          (value, index) => {
            // Condition for no 2 operators can be together
            for (let val = 0; val < value.length; val++) {
              console.log(value, val)
              if (value[val]?.type === "constant" && value[val]?.val?.trim().includes(" ")) return false;
            }
            return true;
          }
        )
        // Testing for 2 consecutive operators/constant
        .test(
          "functionColumns",
          "Constant should be number",
          (value, index) => {
            // Condition for no 2 operators can be together
            for (let val = 0; val < value.length; val++) {
              console.log(value, val)
              if (value[val]?.type === "constant" && !(/^[0-9]*$/.test(value[val]?.val))) return false;
            }
            return true;
          }
        )
        // Testing for parenthesis check
        .test("functionColumns", "Enter a valid parenthesis", (value, index) => {
          let arr = value;

          let stack = [];
          for (let val = 0; val < arr.length; val++) {
            if (arr[val]?.type == "parenthesis") {
              if (arr[val]?.val == "(") {
                stack.push(arr[val].val);
              } else if (stack[stack.length - 1] == "(" && arr[val]?.val == ")") {
                stack.pop();
              } else {
                return false;
              }
            }
          }
          if (stack.length == 0) {
            return true;
          }
          return false;
        })
    })
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
    .filter(
      (c) => search && c.name.toLowerCase().startsWith(search.toLowerCase())
    )
    .slice(0, 10);

  const columnChars = columns
    .filter(
      (c) =>
        columnSearch &&
        c.display.toLowerCase().startsWith(columnSearch.toLowerCase())
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
      else if (["+", "-", "*", "/"].includes(event.key)) {
        event.preventDefault();
        insertMention(editor, { type: "operator", val: event.key });
      }
      else if (["(", ")"].includes(event.key)) {
        event.preventDefault();
        insertMention(editor, { type: "parenthesis", val: event.key });
      }
      else if(/^(\d+)\s$/.test(event.key)){
        event.preventDefault();
        insertMention(editor, { type: "constant", val: event.key });
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
  }, [functionChars.length, columnChars.length, editor, index, search, target]);

  const initialValue = [
    {
      type: "paragraph",
      children: [
        {
          text: "",
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
            setUsedGroupByColumns={setUsedGroupByColumns}
            editor={editor}
            Transforms={Transforms}
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
      {JSON.stringify(formik.errors)}
      <br />
      <Slate
        editor={editor}
        value={initialValue}
        onChange={(value) => {
          setColumnSearch();
          setSearch();
          const { selection } = editor;

          if (selection && Range.isCollapsed(selection)) {
            const [start] = Range.edges(selection);
            const wordBefore = Editor.before(editor, start, { unit: "word" });
            console.log("🚀 ~ file: App.js:349 ~ App ~ wordBefore", wordBefore)

            //match agg funct by checking if @ present
            const beforeForAgg =
            wordBefore && Editor.before(editor, wordBefore);
            console.log("🚀 ~ file: App.js:353 ~ App ~ beforeForAgg", beforeForAgg)
            const beforeRangeForAgg =
            beforeForAgg && Editor.range(editor, beforeForAgg, start);
            console.log("🚀 ~ file: App.js:356 ~ App ~ beforeRangeForAgg", beforeRangeForAgg)
            const beforeTextForAgg =
            beforeRangeForAgg && Editor.string(editor, beforeRangeForAgg);
            console.log("🚀 ~ file: App.js:359 ~ App ~ beforeTextForAgg", beforeTextForAgg)
            const beforeMatch =
              beforeTextForAgg && beforeTextForAgg.match(/^@(\w+)$/);

            //match columns
            const beforeRange =
            wordBefore && Editor.range(editor, wordBefore, start);
            console.log("🚀 ~ file: App.js:365 ~ App ~ beforeRange", beforeRange)
            const beforeText =
            beforeRange && Editor.string(editor, beforeRange);
            console.log("🚀 ~ file: App.js:369 ~ App ~ beforeText", beforeText)
            const beforeColumnMatch = beforeText && beforeText.match(/^([a-zA-Z_])$/);

            const after = Editor.after(editor, start);
            const afterRange = Editor.range(editor, start, after);
            const afterText = Editor.string(editor, afterRange);
            const afterMatch = afterText.match(/^(\s|$)/);

            if (beforeMatch && afterMatch) {
              setTarget(beforeRangeForAgg);
              setSearch(beforeMatch[1]);
              setIndex(0);
              return;
            } else if (beforeColumnMatch && afterMatch) {
              setTarget(beforeRange);
              setColumnSearch(beforeColumnMatch[1]);
              setIndex(0);
              return;
            }
          }

          setTarget(null);
          let arr = [];
          console.log(value);
          value.forEach((obj) => {
            console.log(obj)
            arr.push(obj.children);
          });

          console.log("🚀 ~ file: App.js:372 ~ App ~ arr", arr)
          let stringArray = [];
          // console.log("🚀 ~ file: App.js:372 ~ App ~ arr", arr)

          const children = arr.flat(1).filter((obj) => obj.text !== "");
          console.log("🚀 ~ file: App.js:272 ~ App ~ children", children)
          let objArray = []
          for (let obj of children) {

            if ("text" in obj) {
              const constantObject = {}
              constantObject["type"] = "constant"
              constantObject["val"] = obj.text
              objArray.push(constantObject)
              stringArray.push(obj.text);
            } else if (
              obj.type == "mention" &&
              obj.character.type == "function"
            ) {
              const [column, groupByCol] = getAttributes(obj.character.key)
              const aggParams = {
                Col: column,
                // display: “Sales”,
                groupedBy: groupByCol,
                // groupedByDisplay: Brick
              }
              let tempObj = { ...obj.character }
              tempObj["AggParams"] = aggParams
              objArray.push(tempObj)
              stringArray.push(
                functionToString(obj.character.value, obj.character.key)
              );
            } else if (
              obj.type == "mention" &&
              obj.character.type == "column"
            ) {
              objArray.push(obj.character)
              stringArray.push(obj.character?.val);
            }
            else if (
              obj.type == "mention" &&
              obj.character.type == "operator" || obj.character.type == "parenthesis"
            ) {
              objArray.push(obj.character)
            }
          }
          formik.setFieldValue("functionColumns", objArray)
          // console.log("🚀 ~ file: App.js:292 ~ App ~ stringArray", objArray)
          // console.log(stringArray.join(" ").replace(/ /g, ""));
        }}
      >
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={onKeyDown}
          placeholder="Enter formula..."
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
                      {char.display}
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
