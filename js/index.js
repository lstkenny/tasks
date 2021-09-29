function createElement(tag, attrs = {}, children = null) {
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
				element.textContent = child
			} else if (typeof child === "object") {
				element.appendChild(child)
			}
		})
	}
	return element
}

function createListItem(item, index) {
	const listItem = createElement("li", {
		id: `item-${item.id}`
	}, [
		createElement("input", {
			id: item.id,
			type: "checkbox",
			checked: item.done,
			"data-id": item.id,
			"data-action": "toggle",
			onchange: toggleTask
		}),
		createElement("label", {
				for: item.id
			}, [
				`${index}. ${item.title}`,
				createElement("a", {
						href: "#",
						"data-id": item.id,
						"data-action": "subtask",
						class: "btn",
						title: "Add subtask"
					}, 
					createElement("i", {
						class: "fas fa-plus-square"
					})
				),
				createElement("a", {
						href: "#",
						"data-id": item.id,
						"data-action": "delete",
						class: "btn btn-danger",
						title: "Delete task"
					}, 
					createElement("i", {
						class: "fas fa-minus-square"
					})
				)
			]
		),
	])
	return listItem
}

function updateListItem(task) {
	const listCheck = document.getElementById(task.id)
	if (!listCheck) {
		return
	}
	listCheck.checked = task.done
}

function createTaskList(tasks) {
	const list = createElement("ul")
	tasks.forEach((task, index) => {
		const item = createListItem(task, index + 1)
		if (task.tasks) {
			item.appendChild(createTaskList(task.tasks))
		}
		list.appendChild(item)
	})
	return list
}

function updateTasksList(tasks) {
	tasks.forEach(task => {
		updateListItem(task)
		if (task.tasks) {
			updateTasksList(task.tasks)
		}
	})
}

function findTask(id, items) {
	for (let i = 0; i < items.length; i++) {
		const task = items[i]
		if (task.id === id) {
			return task
		}
		if (task.tasks) {
			const found = findTask(id, task.tasks)
			if (found) {
				return found
			}
		}
	}
	return false
}

function updateParentDone(items) {
	let result = true
	for (let i = 0; i < items.length; i++) {
		const task = items[i]
		result = result && task.done
		if (task.tasks) {
			task.done = updateParentDone(task.tasks)
		}
	}
	return result
}

function updateChildrenDone(items) {
	for (let i = 0; i < items.length; i++) {
		const task = items[i]
		task.done = true
		if (task.tasks) {
			updateChildrenDone(task.tasks)
		}
	}
}

function toggleTask(e) {
	const { checked, id } = e.target
	const task = findTask(Number(id), tasks)
	if (task) {
		task.done = checked
		// console.log(`Task #${id} done status updated to ${checked}`)
	}
	if (checked && task.tasks) {
		updateChildrenDone(task.tasks)
		console.log(task.tasks)
	}
	updateParentDone(tasks)
	updateTasksList(tasks)
}

function addSubtaskForm(e) {

}

function deleteTask(e) {

}

const tasks = [{
	id: 123,
	title: "Make Google",
	description: "Make big company",
	done: true,
	due: false,
	tasks: [{
		id: 2123,
		title: "Make Search",
		description:"Make search engine",
		done: true,
		due: false,
	}, {
		id: 987,
		title: "Make Gmail",
		description:"Make email service",
		done: false,
		due: false,
		tasks: [{
			id: 384,
			title: "Send emails",
			description: "",
			done: false,
			due: false
		}, {
			id: 3834,
			title: "Receive emails",
			description: "",
			done: false,
			due: false
		}]
	}, {
		id: 234,
		title: "Buy Youtube",
		description:"Join youtube service",
		done: false,
		due: false,
	}]
}]

document.getElementById("tasks").appendChild(createTaskList(tasks))