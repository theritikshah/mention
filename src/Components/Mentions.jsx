import { useSelected, useFocused } from "slate-react";
import columns from "../columns";
import { v4 as uuidv4 } from "uuid";

const Mention = ({
  attributes,
  children,
  element,
  formik,
  setUsedColumns,
  setUsedGroupByColumns,
  editor,
  Transforms,
}) => {
  const selected = useSelected();
  const focused = useFocused();
  const style = {
    padding: "3px 3px 2px",
    margin: "0 1px",
    verticalAlign: "baseline",
    display: "inline-flex",
    borderRadius: "4px",
    backgroundColor: "#11a68378",
    fontSize: "0.9em",
    boxShadow: selected && focused ? "0 0 0 2px #B4D5FF" : "none",
  };

  const styleForAggFunc = {
    padding: "3px 3px 2px",
    margin: "0 1px",
    verticalAlign: "baseline",
    display: "inline-flex",
    borderRadius: "4px",
    backgroundColor: "#4a6ee07a",
    fontSize: "0.9em",
    boxShadow: selected && focused ? "0 0 0 2px #B4D5FF" : "none",
  };
  const styleForOperators = {
    padding: "3px 3px 2px",
    margin: "0 1px",
    verticalAlign: "baseline",
    display: "inline-flex",
    borderRadius: "4px",
    backgroundColor: "yellow",
    fontSize: "0.9em",
    boxShadow: selected && focused ? "0 0 0 2px #B4D5FF" : "none",
  };
  const styleForParenthesis = {
    padding: "3px 3px 2px",
    margin: "0 1px",
    verticalAlign: "baseline",
    display: "inline-flex",
    borderRadius: "4px",
    backgroundColor: "pink",
    fontSize: "0.9em",
    boxShadow: selected && focused ? "0 0 0 2px #B4D5FF" : "none",
  };

  const handleSelectChange = (e) => {
    setUsedColumns((prev) => {
      if (prev.some((obj) => obj.key === element.character.key)) {
        return prev
          .filter((obj) => obj.key !== element.character.key)
          .concat([{ name: e.target.value, key: element.character.key }]);
      }

      return [
        ...prev,
        {
          name: e.target.value,
          key: element.character.key,
        },
      ];
    });

    Transforms.select(editor, { offset: 0, path: [0, 0] });
  };

  const handleSelectGroupByChange = (e) => {
    setUsedGroupByColumns((prev) => {
      if (prev.some((obj) => obj.key === element.character.key)) {
        return prev
          .filter((obj) => obj.key !== element.character.key)
          .concat([{ name: e.target.value, key: element.character.key }]);
      }

      return [
        ...prev,
        {
          name: e.target.value,
          key: element.character.key,
        },
      ];
    });

    Transforms.select(editor, { offset: 0, path: [0, 0] });
  };

  const selectStyle = {
    borderRadius: "50px",
    padding: "0 5px",
  };

  // See if our empty text child has any styling marks applied and apply those
  if (element.children[0].bold) {
    style.fontWeight = "bold";
  }
  if (element.children[0].italic) {
    style.fontStyle = "italic";
  }

  if (element.character.Type === "column") {
    return (
      <span
        {...attributes}
        contentEditable={false}
        data-cy={`mention-${element.character.Display.replace(" ", "-")}`}
        style={style}
      >
        {children}
        {element.character.Display}
      </span>
    );
  } else if (element.character.type === "function") {
    return (
      <span
        {...attributes}
        contentEditable={false}
        data-cy={`mention-${element.character.name.replace(" ", "-")}`}
        style={styleForAggFunc}
      >
        {children}@{`${element.character.name} (Column: `}
        <select onChange={handleSelectChange} style={selectStyle}>
          <option key="column" value="">
            select Column
          </option>
          {columns.map((column) => (
            <option key={column.Val} value={column.Val}>
              {column.Display}
            </option>
          ))}
        </select>{" "}
        &nbsp;, GroupBy:&nbsp;
        <select onChange={handleSelectGroupByChange} style={selectStyle}>
          <option key="groupby" value="">
            select GroupBy Column
          </option>
          {columns.map((column) => (
            <option key={column.Val} value={column.Val}>
              {" "}
              {column.Display}
            </option>
          ))}
        </select>
        &nbsp;)
      </span>
    );
  } else if (
    element.character.type === "operator" ||
    element.character.type === "parenthesis"
  ) {
    return (
      <span
        {...attributes}
        contentEditable={false}
        data-cy={`mention-${element.character.val.replace(" ", "-")}`}
        style={
          element.character.type === "parenthesis"
            ? styleForParenthesis
            : styleForOperators
        }
      >
        {children}
        {element.character.val}
      </span>
    );
  }
};

export default Mention;
