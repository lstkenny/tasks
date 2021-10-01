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

class ToDo {
	constructor() {
		this.todoStorage = "tasks"
		this.todoCurrent = "task"
		this.loadData()
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
	setAfter(sourceId, targetId) {
		const source = this.getTask(sourceId)
		const target = this.getTask(targetId)
		source.parentId = target.parentId
		const sourceIndex = this.tasks.findIndex(task => task.id === sourceId)
		const targetIndex = this.tasks.findIndex(task => task.id === targetId)
		this.tasks.splice(sourceIndex, 1)
		this.tasks.splice(targetIndex, 0, source)
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
	setList(name) {
		this.list = name
		this.tasks = this.listData[name]
	}
	createList(name) {
		this.list = name
		this.tasks = []
		this.saveData()
		this.loadData()
	}
	deleteList(name) {
		if (!name) {
			name = this.list
		}
		if (this.listData[name]) {
			delete this.listData[name]
		}
		this.saveData()
		this.loadData()
	}
	loadData() {
		try {
			this.listData = JSON.parse(localStorage.getItem(this.todoStorage)) || {}
		} catch(e) {
			console.warn(e)
			this.listData = {}
		}
		this.listNames = Object.keys(this.listData)
		this.list = localStorage.getItem(this.todoCurrent) || this.listNames[0] || ""
		this.tasks = this.listData[this.list] || []
		console.log("loading data: ", this.list, this.listData)
	}
	saveData(tasks) {
		this.listData[this.list] = this.tasks
		localStorage.setItem(this.todoStorage, JSON.stringify(this.listData))
		localStorage.setItem(this.todoCurrent, this.list)
		console.log("saving data: ", this.list, this.listData)
	}
}

class TaskBoard {
	constructor() {
		this.container = document.getElementById("tasks")
		this.menu = document.getElementById("list")
		this.todo = new ToDo()
		this.newTaskForm = this.createNewTaskForm()
		this.renderMenu()
		this.renderTasks()
		
	}
	allowDrop(e) {
		e.preventDefault()
		if (e.target.dataset.name === "list-item") {
			document.querySelectorAll(".drag-over").forEach(item => item.classList.remove("drag-over"))
			e.target.classList.add("drag-over")
		}
	}
	drop(e) {
		e.preventDefault()
		const targetItem = e.target
		if (targetItem.dataset.name === "list-item") {
			const sourceElementId = e.dataTransfer.getData("text")
			const sourceItem = document.getElementById(sourceElementId)
			const sourceId = Number(sourceItem.dataset.id)
			const targetId = Number(targetItem.dataset.id)
			if (sourceId !== targetId) {
				this.todo.setAfter(sourceId, targetId)
				this.renderTasks()
				this.todo.saveData()
			}
			// targetItem.insertAdjacentElement("afterend", sourceItem)
			// document.querySelectorAll(".list-item").forEach(item => item.classList.remove("drag-over"))
		}
	}
	drag(e) {
		const id = e.target.id
		e.dataTransfer.setData("text", id)
	}
	selectListName(e) {
		const option = e.target
		const input = document.getElementById("list-name")
		option.nextElementSibling.value = option.value
		if (!option.value) {
			input.readOnly = false
			input.focus()
			this.container.textContent = ""
		} else {
			input.readOnly = true
			this.todo.setList(option.value)
			this.renderTasks()
		}
	}
	createNewList(e) {
		const input = e.target
		if (!input.value) {
			return
		}
		this.todo.createList(input.value)
		this.renderMenu()
		this.renderTasks()
	}
	deleteList(e) {
		this.todo.deleteList()
		this.renderMenu()
		this.renderTasks()
	}
	createListMenu() {
		const _this = this
		const options = this.todo.listNames.map(list => createElement("option", {
			value: list,
			selected: (list === this.todo.list)
		}, list))
		options.unshift(createElement("option", {
			value: ""
		}, "+ Create list"))
		return createElement("div", {
			class: "select-editable"
		}, [
			createElement("select", {
				id: "list-select",
				onchange: this.selectListName.bind(_this)
			}, options),
			createElement("input", {
				id: "list-name",
				placeholder: "New list",
				readonly: true,
				value: this.todo.list,
				onchange: this.createNewList.bind(_this)
			})
		])
	}
	createListItem(item, index) {
		const buttons = []
		if (this.todo.hasSubtasks(item.id)) {
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
				id: `item-${item.id}`,
				class: "list-item",
				"data-id": item.id,
				"data-name": "list-item",
				draggable: true,
				ondragstart: this.drag.bind(_this)
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
		const _this = this
		const list = createElement("ul", {
			ondrop: this.drop.bind(_this),
			ondragover: this.allowDrop.bind(_this)
		})
		const tasks = this.todo.getSubtasks(parentId)
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
		const tasks = this.todo.getSubtasks(parentId)
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
			const task = this.todo.getTask(id)
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
		const task = this.todo.getTask(Number(id))
		if (task) {
			task.done = checked
			// console.log(`Task #${id} done status updated to ${checked}`)
		}
		this.todo.updateChildrenDone(task.id, checked)
		this.todo.updateTasksDone()
		this.updateTasksList()
		this.todo.saveData()
	}
	toggleExpanded(id) {
		const listItem = document.getElementById(`item-${id}`)
		const button = listItem.querySelector("a[data-action='expand']")
		const icon = button.querySelector("i")
		const task = this.todo.getTask(Number(id))
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
		this.todo.removeTask(id)
		this.renderTasks()
		this.todo.saveData()
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
		this.todo.addTask(newTask, parentId)
		title.value = ""
		this.renderTasks()
		title.focus()
		this.addSubtaskForm(parentId)
		this.todo.saveData()
	}
	renderTasks() {
		this.container.textContent = ""
		this.container.appendChild(this.createTaskList())
		this.container.appendChild(this.newTaskForm)
	}
	renderMenu() {
		const _this = this
		this.menu.textContent = ""
		this.menu.appendChild(this.createListMenu())
		this.menu.appendChild(createElement("a", {
			class: "btn btn-danger",
			href: "#",
			onclick: this.deleteList.bind(_this)
		}, createElement("i", {
			class: "fas fa-trash-alt"
		})))
	}
}

new TaskBoard()