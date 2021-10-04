/* Data manipulations */

function findTask(id, items) {
	for (let i = 0; i < items.length; i++) {
		if (items[i].id === id) {
			return items[i]
		}
		if (items[i].tasks) {
			const found = findTask(id, items[i].tasks)
			if (found) {
				return found
			}
		}
	}
	return false
}

function findParentId(id, items, parent = false) {
	for (let i = 0; i < items.length; i++) {
		if (items[i].id === id) {
			return parent
		}
		if (items[i].tasks) {
			const found = findParentId(id, items[i].tasks, items[i].id)
			if (found) {
				return found
			}
		}
	}
	return false
}

function removeTask(id, items) {
	for (let i = 0; i < items.length; i++) {
		if (items[i].id === id) {
			items = items.splice(i, 1)
			return
		}
		if (items[i].tasks) {
			const found = removeTask(id, items[i].tasks)
		}
	}
	return false
}

function updateParentDone(items) {
	let result = true
	for (let i = 0; i < items.length; i++) {
		if (items[i].tasks) {
			items[i].done = updateParentDone(items[i].tasks)
		}
		result = result && items[i].done
	}
	return result
}

function updateChildrenDone(items, checked) {
	for (let i = 0; i < items.length; i++) {
		items[i].done = checked
		if (items[i].tasks) {
			updateChildrenDone(items[i].tasks, checked)
		}
	}
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


/* DOM manipulations */

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
	const buttons = []
	if (item.tasks) {
		buttons.push(
			createElement("a", {
					href: "#",
					"data-id": item.id,
					"data-action": "expand",
					class: "btn",
					title: (item.collapsed) ? "Expand" : "Collapse",
					onclick: () => toggleExpanded(item.id)
				}, 
				createElement("i", {
					class: "fas " + (item.collapsed ? " fa-angle-up" : " fa-angle-down")
				})
			),
		)
	}
	buttons.push(
		createElement("a", {
				href: "#",
				"data-id": item.id,
				"data-action": "subtask",
				class: "btn btn-hidden",
				title: "Add subtask",
				onclick: () => addSubtaskForm(item.id)
			}, 
			createElement("i", {
				class: "fas fa-plus-square"
			})
		)
	)
	buttons.push(
		createElement("a", {
				href: "#",
				"data-id": item.id,
				"data-action": "delete",
				class: "btn btn-hidden btn-danger",
				title: "Delete task",
				onclick: () => deleteTask(item.id)
			}, 
			createElement("i", {
				class: "fas fa-minus-square"
			})
		)
	)
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
					...buttons
				]
			),
		]
	)
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
				onclick: moveTaskForm
			}, createElement("i", {
				class: "fas fa-arrow-up"
			})
		)
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

function addSubtaskForm(id) {
	const addButton = document.getElementById("new-task-id")
	const moveButton = document.getElementById("move-task-up")
	const input = document.getElementById("new-task-title")
	if (!Number(id)) {
		addButton.dataset.id = 0
		moveButton.dataset.id = 0
		taskContainer.appendChild(newTaskForm)
	} else {
		const listItem = document.getElementById(`item-${id}`)
		addButton.dataset.id = id
		moveButton.dataset.id = findParentId(id, tasks)
		listItem.appendChild(newTaskForm)
	}
	input.focus()
}

function moveTaskForm(e) {
	const button = document.getElementById("move-task-up")
	const parentId = Number(button.dataset.id)
	addSubtaskForm(parentId)
}

/* Events */

function toggleTask(e) {
	const { checked, id } = e.target
	const task = findTask(Number(id), tasks)
	if (task) {
		task.done = checked
	}
	if (task.tasks) {
		updateChildrenDone(task.tasks, checked)
	}
	updateParentDone(tasks)
	updateTasksList(tasks)
	saveTasks(tasks)
}

function toggleExpanded(id) {
	const listItem = document.getElementById(`item-${id}`)
	const button = listItem.querySelector("a[data-action='expand']")
	const icon = button.querySelector("i")
	const task = findTask(Number(id), tasks)
	task.collapsed = !task.collapsed
	listItem.classList.remove("collapsed")
	if (task.collapsed) {
		listItem.classList.add("collapsed")
		button.title = "Expand"
		icon.classList.remove("fa-angle-down")
		icon.classList.add("fa-angle-up")
	} else {
		button.title = "Collapse"
		icon.classList.remove("fa-angle-up")
		icon.classList.add("fa-angle-down")
	}
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
	const newTask = {
		id: Date.now(),
		title: title.value,
		description: "",
		done: false,
		due: false
	}
	let task
	const parentId = Number(parent.dataset.id)
	if (parentId) {
		task = findTask(parentId, tasks)
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
	title.focus()
	addSubtaskForm(parentId)
	saveTasks(tasks)
}

async function loadDemoData() {
	const response = await fetch("./demo.json")
	const data = await response.json()
	await saveTasks(data)
	location.reload()
}

function renderTasks() {
	taskContainer.textContent = ""
	const tasksList = createTaskList(tasks)
	taskContainer.appendChild(tasksList)
	taskContainer.appendChild(newTaskForm)
}

const tasks = loadTasks()
const taskContainer = document.getElementById("tasks")
const newTaskForm = createNewTaskForm()
renderTasks()

document.getElementById("demo").addEventListener("click", loadDemoData)
// document.body.addEventListener("click", addSubtaskForm)