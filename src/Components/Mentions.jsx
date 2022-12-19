import { useSelected, useFocused } from "slate-react";
import columns from "../columns";

const Mention = ({ attributes, children, element }) => {
  const selected = useSelected();
  const focused = useFocused();
  const style = {
    padding: "3px 3px 2px",
    margin: "0 1px",
    verticalAlign: "baseline",
    display: "inline-flex",
    borderRadius: "4px",
    backgroundColor: "#eee",
    fontSize: "0.9em",
    boxShadow: selected && focused ? "0 0 0 2px #B4D5FF" : "none",
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
        style={style}
      >
        {children}@{`${element.character.name} (Column: `}
        <select style={selectStyle}>
          <option>select Column</option>
          {columns.map((column) => (
            <option>{column.Display}</option>
          ))}
        </select>{" "}
        &nbsp;, GroupBy:&nbsp;
        <select style={selectStyle}>
          <option>select GroupBy Column</option>
          {columns.map((column) => (
            <option>{column.Display}</option>
          ))}
        </select>
        &nbsp;)
      </span>
    );
  }
};

export default Mention;
