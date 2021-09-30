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

class Task {
	id
	parentId
	title
	description
	done
	due
	constructor(data) {
		this.id = data.id || Date.now()
		this.parentId = data.parentId || null
		this.title = data.title || ""
		this.description = data.description || ""
		this.done = data.done || false
		this.due = data.due || Date.now() + 24 * 60 * 60 * 1000
	}
}

class TaskList {
	constructor(name) {
		this.name = name
		this.loadTasks()
	}
	find(params) {
		return this.tasks.filter(task => {
			let match = true
			for (let key in params) {
				match = match && params[key] === task[key]
			}
			return match
		})
	}
	getTask(id) {
		return this.tasks.find(task => task.id === id)
	}
	hasSubtasks(id) {
		return !!this.tasks.find(task => task.parentId === id)
	}
	getSubtasks(id) {
		return this.find({ parentId: id })
	}
	removeTask(id) {
		this.tasks = this.tasks.filter(task => task.id != id)
		const subtasks = this.getSubtasks(id)
		subtasks.forEach(task => this.removeTask(task.id))
	}
	addTask(data, parentId = null) {
		this.tasks.push(new Task({
			parentId,
			...data
		}))
	}
	updateTasksDone(task = {}) {
		const subtasks = this.getSubtasks(task.id || null)
		if (!subtasks.length) {
			return task.done
		}
		let done = true
		subtasks.forEach(task => {
			task.done = this.updateTasksDone(task)
			done = done && task.done
		})
		return done
	}
	updateChildrenDone(parentId, checked) {
		const subtasks = this.getSubtasks(parentId)
		subtasks.forEach(task => {
			task.done = checked
			this.updateChildrenDone(task.id, checked)
		})
	}
	loadData() {
		try {
			return JSON.parse(localStorage.getItem("tasks")) || {}
		} catch(e) {
			console.warn(e)
			return {}
		}
	}
	loadTasks() {
		const data = this.loadData()
		console.log("loading data: ", data)
		this.tasks = data[this.name] || []
	}
	saveTasks(tasks) {
		const data = this.loadData()
		data[this.name] = this.tasks
		console.log("saving data: ", data)
		localStorage.setItem("tasks", JSON.stringify(data))
	}
}

class TaskBoard {
	constructor() {
		this.container = document.getElementById("tasks")
		this.taskList = new TaskList("TO DO")
		this.newTaskForm = this.createNewTaskForm()
		this.renderTasks()
		
	}
	createListItem(item, index) {
		const buttons = []
		if (this.taskList.hasSubtasks(item.id)) {
			buttons.push(
				createElement("a", {
						href: "#",
						"data-id": item.id,
						"data-action": "expand",
						class: "btn",
						title: (item.collapsed) ? "Expand" : "Collapse",
						onclick: () => this.toggleExpanded(item.id)
					}, 
					createElement("i", {
						class: "fas " + (item.collapsed ? "fa-angle-up" : "fa-angle-down")
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
					onclick: () => this.addSubtaskForm(item.id)
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
					onclick: () => this.deleteTask(item.id)
				}, 
				createElement("i", {
					class: "fas fa-minus-square"
				})
			)
		)
		const _this = this
		const listItem = createElement("li", {
				id: `item-${item.id}`
			}, [
				createElement("input", {
					id: item.id,
					type: "checkbox",
					checked: item.done,
					"data-id": item.id,
					"data-action": "toggle",
					onchange: this.toggleTask.bind(_this)
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
	createNewTaskForm() {
		const _this = this
		return createElement("form", {
			class: "new-task",
			onsubmit: this.createTask.bind(_this)
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
					onclick: this.moveTaskForm.bind(_this)
				}, createElement("i", {
					class: "fas fa-arrow-up"
				})
			)
		])
	}
	updateListItem(task) {
		const listCheck = document.getElementById(task.id)
		if (!listCheck) {
			return
		}
		listCheck.checked = task.done
	}
	createTaskList(parentId = null) {
		const list = createElement("ul")
		const tasks = this.taskList.getSubtasks(parentId)
		tasks.forEach((task, index) => {
			const item = this.createListItem(task, index + 1)
			const children = this.createTaskList(task.id)
			if (children) {
				item.appendChild(children)
			}
			list.appendChild(item)
		})
		return list
	}
	updateTasksList(parentId = null) {
		const tasks = this.taskList.getSubtasks(parentId)
		tasks.forEach(task => {
			this.updateListItem(task)
			this.updateTasksList(task.id)
		})
	}
	addSubtaskForm(id) {
		const addButton = document.getElementById("new-task-id")
		const moveButton = document.getElementById("move-task-up")
		const input = document.getElementById("new-task-title")
		if (!Number(id)) {
			addButton.dataset.id = 0
			moveButton.dataset.id = 0
			this.container.appendChild(this.newTaskForm)
		} else {
			const listItem = document.getElementById(`item-${id}`)
			const task = this.taskList.getTask(id)
			addButton.dataset.id = id
			moveButton.dataset.id = task.parentId
			listItem.appendChild(this.newTaskForm)
		}
		input.focus()
	}
	moveTaskForm(e) {
		const button = document.getElementById("move-task-up")
		const parentId = Number(button.dataset.id)
		this.addSubtaskForm(parentId)
	}
	toggleTask(e) {
		const { checked, id } = e.target
		const task = this.taskList.getTask(Number(id))
		if (task) {
			task.done = checked
			// console.log(`Task #${id} done status updated to ${checked}`)
		}
		this.taskList.updateChildrenDone(task.id, checked)
		this.taskList.updateTasksDone()
		this.updateTasksList()
		this.taskList.saveTasks()
	}
	toggleExpanded(id) {
		const listItem = document.getElementById(`item-${id}`)
		const button = listItem.querySelector("a[data-action='expand']")
		const icon = button.querySelector("i")
		const task = this.taskList.getTask(Number(id))
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
	deleteTask(id) {
		const listItem = document.getElementById(`item-${id}`)
		if (listItem) {
			listItem.remove()
		}
		this.taskList.removeTask(id)
		this.renderTasks()
		this.taskList.saveTasks()
	}
	createTask(e) {
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
		const parentId = Number(parent.dataset.id)
		this.taskList.addTask(newTask, parentId)
		title.value = ""
		this.renderTasks()
		title.focus()
		this.addSubtaskForm(parentId)
		this.taskList.saveTasks()
	}
	renderTasks() {
		this.container.textContent = ""
		this.container.appendChild(this.createTaskList())
		this.container.appendChild(this.newTaskForm)
	}
}

new TaskBoard()