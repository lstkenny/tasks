export function createElement(tag, attrs = {}, children = null) {
	const element = document.createElement(tag)
	for (let key in attrs) {
		element.setAttribute(key, attrs[key])
		element[key] = attrs[key]
	}
	if (children) {
		if (!Array.isArray(children)) {
			children = [children]
		}
		children.forEach(child => {
			if (typeof child === "string") {
				element.appendChild(document.createTextNode(child))
			} else if (typeof child === "object") {
				element.appendChild(child)
			}
		})
	}
	return element
}
export function createNewTaskForm({ createTaskHandler, moveFormHandler }) {
	return createElement("form", {
		class: "new-task",
		onsubmit: createTaskHandler
	}, [
		createElement("input", {
			id: "new-task-title",
			name: "title",
			placeholder: "New task",
		}),
		" ",
		createElement("button", {
				id: "new-task-id",
				title: "Add task"
			}, createElement("i", {
				class: "fas fa-plus"
			})
		),
		" ",
		createElement("button", {
				id: "move-task-up",
				type: "button",
				title: "Up level",
				onclick: moveFormHandler
			}, createElement("i", {
				class: "fas fa-arrow-up"
			})
		)
	])
}
function createExpandSubtasksButton(item, expandCallback) {
	return createElement("a", {
			href: "#",
			"data-id": item.id,
			"data-action": "expand",
			class: "btn",
			title: (item.collapsed) ? "Expand" : "Collapse",
			onclick: () => expandCallback(item.id)
		}, 
		createElement("i", {
			class: "fas " + (item.collapsed ? "fa-angle-up" : "fa-angle-down")
		})
	)
}
function createAddSubtaskButton(item, subtaskCallback) {
	return createElement("a", {
			href: "#",
			"data-id": item.id,
			"data-action": "subtask",
			class: "btn btn-hidden",
			title: "Add subtask",
			onclick: () => subtaskCallback(item.id)
		}, 
		createElement("i", {
			class: "fas fa-plus-square"
		})
	)
}
function createDeleteTaskButton(item, deleteCallback) { 
	return createElement("a", {
			href: "#",
			"data-id": item.id,
			"data-action": "delete",
			class: "btn btn-hidden btn-danger",
			title: "Delete task",
			onclick: () => deleteCallback(item.id)
		}, 
		createElement("i", {
			class: "fas fa-minus-square"
		})
	)
}
export function createListItem({ item, index, hasSubtasks, expandHandler, subtaskHandler, deleteHandler, dragHandler, toggleHandler }) {
	const buttons = []
	if (hasSubtasks) {
		buttons.push(createExpandSubtasksButton(item, expandHandler))
	}
	buttons.push(createAddSubtaskButton(item, subtaskHandler))
	buttons.push(createDeleteTaskButton(item, deleteHandler))
	const listItem = createElement("li", {
			id: `item-${item.id}`,
			class: "list-item",
			"data-id": item.id,
			"data-name": "list-item",
			draggable: true,
			ondragstart: dragHandler
		}, [
			createElement("input", {
				id: item.id,
				type: "checkbox",
				checked: item.done,
				"data-id": item.id,
				"data-action": "toggle",
				onchange: toggleHandler
			}),
			createElement("label", {
					for: item.id
				}, [
					`${index}. ${item.title}`,
					...buttons
				]
			),
		]
	)
	return listItem
}
function createListSelect({ items, currentItem, selectListHandler, createListHandler }) {
	const options = items.map(list => createElement("option", {
		value: list.id,
		selected: (list.id === currentItem.id)
	}, list.name))
	options.unshift(createElement("option", {
		value: ""
	}, "+ Create list"))
	return createElement("div", {
		class: "select-editable"
	}, [
		createElement("select", {
			id: "list-select",
			onchange: selectListHandler
		}, options),
		createElement("input", {
			id: "list-name",
			placeholder: "New list",
			readonly: true,
			value: currentItem.name,
			onchange: createListHandler
		})
	])
}
function createDeleteListButton({ deleteListHandler }) {
	return createElement("a", {
		class: "btn btn-danger",
		href: "#",
		onclick: deleteListHandler
	}, createElement("i", {
		class: "fas fa-trash-alt"
	}))
}
export function createListNavigation({ items, currentItem, selectListHandler, createListHandler, deleteListHandler }) {
	return createElement("nav", {}, [
		createListSelect({
			items,
			currentItem,
			selectListHandler,
			createListHandler
		}),
		createDeleteListButton({
			deleteListHandler
		})
	])
}
