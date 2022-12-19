import { useSelected, useFocused } from "slate-react";
import columns from "../columns";

const Mention = ({ attributes, children, element }) => {
  const selected = useSelected();
  const focused = useFocused();
  const style = {
    padding: "3px 3px 2px",
    margin: "0 1px",
    verticalAlign: "baseline",
    display: "inline-block",
    borderRadius: "4px",
    backgroundColor: "#eee",
    fontSize: "0.9em",
    boxShadow: selected && focused ? "0 0 0 2px #B4D5FF" : "none",
  };
  // See if our empty text child has any styling marks applied and apply those
  if (element.children[0].bold) {
    style.fontWeight = "bold";
  }
  if (element.children[0].italic) {
    style.fontStyle = "italic";
  }

  console.log(element);

  if (typeof element.character === "object") {
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
  }

  return (
    <span
      {...attributes}
      contentEditable={false}
      data-cy={`mention-${element.character.replace(" ", "-")}`}
      style={style}
    >
      {children}@{element.character}
    </span>
  );
};

export default Mention;
