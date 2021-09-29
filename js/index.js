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
				element.appendChild(document.createTextNode(child))
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
						title: "Add subtask",
						onclick: () => addSubtaskForm(item.id)
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
						title: "Delete task",
						onclick: () => deleteTask(item.id)
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

function createNewTaskForm() {
	return createElement("form", {
		class: "new-task",
		onsubmit: createTask
	}, [
		createElement("input", {
			id: "new-task-title",
			name: "title",
			placeholder: "New task",
		}),
		" ",
		createElement("button", {
			id: "new-task-id"
		}, "Add")
	])
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

function removeTask(id, items) {
	for (let i = 0; i < items.length; i++) {
		const task = items[i]
		if (task.id === id) {
			items = items.splice(i, 1)
			return
		}
		if (task.tasks) {
			const found = removeTask(id, task.tasks)
		}
	}
	return false
}

function updateParentDone(items) {
	let result = true
	for (let i = 0; i < items.length; i++) {
		const task = items[i]
		if (task.tasks) {
			task.done = updateParentDone(task.tasks)
		}
		result = result && task.done
	}
	return result
}

function updateChildrenDone(items, checked) {
	for (let i = 0; i < items.length; i++) {
		const task = items[i]
		task.done = checked
		if (task.tasks) {
			updateChildrenDone(task.tasks, checked)
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
	if (task.tasks) {
		updateChildrenDone(task.tasks, checked)
	}
	updateParentDone(tasks)
	updateTasksList(tasks)
	saveTasks(tasks)
}

function addSubtaskForm(id) {
	const button = document.getElementById("new-task-id")
	const input = document.getElementById("new-task-title")
	if (!Number(id)) {
		taskContainer.appendChild(newTaskForm)
	} else {
		const listItem = document.getElementById(`item-${id}`)
		button.dataset.id = id
		listItem.appendChild(newTaskForm)
	}
	input.focus()
}

function deleteTask(id) {
	const listItem = document.getElementById(`item-${id}`)
	if (listItem) {
		listItem.remove()
	}
	removeTask(id, tasks)
	renderTasks()
	saveTasks(tasks)
}

function createTask(e) {
	e.preventDefault()
	const parent = document.getElementById("new-task-id")
	const title = document.getElementById("new-task-title")
	const task = findTask(Number(parent.dataset.id), tasks)
	const newTask = {
		id: Date.now(),
		title: title.value,
		description: "",
		done: false,
		due: false
	}
	if (task) {
		if (!task.tasks) {
			task.tasks = []
		}
		task.tasks.push(newTask)
	} else {
		tasks.push(newTask)
	}
	title.value = ""
	renderTasks()
	saveTasks(tasks)
}

function renderTasks() {
	taskContainer.textContent = ""
	const tasksList = createTaskList(tasks)
	taskContainer.appendChild(tasksList)
	taskContainer.appendChild(newTaskForm)
}

async function loadDemoData() {
	const response = await fetch("./demo.json")
	const data = await response.json()
	await saveTasks(data)
	location.reload()
}

function loadTasks() {
	try {
		return JSON.parse(localStorage.getItem("tasks")) || []
	} catch(e) {
		return []
	}
}

function saveTasks(tasks) {
	localStorage.setItem("tasks", JSON.stringify(tasks))
}

const tasks = loadTasks()
const taskContainer = document.getElementById("tasks")
const newTaskForm = createNewTaskForm()
renderTasks()

document.getElementById("demo").addEventListener("click", loadDemoData)
// document.body.addEventListener("click", addSubtaskForm)