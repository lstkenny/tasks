import { dragStart, dragOver, drop } from "./drag.js"
import { createElement, createListNavigation, createNewTaskForm, createListItem } from "./dom.js"
import TaskStorage from "./taskstorage.js"

class TaskBoard {
	constructor() {
		this.container = document.getElementById("tasks")
		this.menu = document.getElementById("list")
		this.newTaskForm = createNewTaskForm({
			createTaskHandler: this.createTask.bind(this), 
			moveFormHandler: this.moveTaskForm.bind(this)
		})
		this.taskStorage = new TaskStorage()
		this.render()
	}
	async loadDemoData() {
		const response = await fetch("./demo.json")
		const data = await response.json()
		this.taskStorage.clearData()
		this.taskStorage.createList(data)
		this.render()
	}
	selectListName(e) {
		const option = e.target
		const input = document.getElementById("list-name")
		if (!option.value) {
			input.value = ""
			input.readOnly = false
			input.focus()
			this.container.textContent = ""
		} else {
			this.taskList = this.taskStorage.getList(Number(option.value))
			input.readOnly = true
			input.value = this.taskList.name
			this.renderTasks()
		}
	}
	createNewList(e) {
		const input = e.target
		if (!input.value) {
			return
		}
		this.taskStorage.createList({
			name: input.value
		})
		this.render()
	}
	deleteList(e) {
		if (!this.taskList) {
			return
		}
		this.taskStorage.deleteList(this.taskList)
		this.render()
	}
	updateListItem(task) {
		const listCheck = document.getElementById(task.id)
		if (!listCheck) {
			return
		}
		listCheck.checked = task.done
	}
	moveTask(e) {
		drop(e, (sourceId, targetId) => {
			this.taskList.moveTaskAfter(sourceId, targetId)
			this.renderTasks()
			this.taskStorage.updateList(this.taskList)
		})
	}
	createTaskList(parentId = null) {
		const list = createElement("ul", {
			ondrop: this.moveTask.bind(this),
			ondragover: dragOver
		})
		if (!this.taskList) {
			return list
		}
		const tasks = this.taskList.getSubtasks(parentId)
		tasks.forEach((task, index) => {
			const item = createListItem({ 
				item: task,
				index: index + 1,
				hasSubtasks: this.taskList.hasSubtasks(task.id),
				expandHandler: this.toggleExpanded.bind(this),
				subtaskHandler: this.addSubtaskForm.bind(this),
				deleteHandler: this.deleteTask.bind(this),
				dragHandler: dragStart,
				toggleHandler: this.toggleTask.bind(this)
			})
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
		const addButton = this.newTaskForm.querySelector("#new-task-id")
		const moveButton = this.newTaskForm.querySelector("#move-task-up")
		const input = this.newTaskForm.querySelector("#new-task-title")
		if (!Number(id)) {
			addButton.dataset.id = 0
			moveButton.dataset.id = 0
			this.container.appendChild(this.newTaskForm)
		} else {
			const listItem = document.getElementById(`item-${id}`)
			const task = this.taskList.getTask(Number(id))
			addButton.dataset.id = id
			moveButton.dataset.id = task.parentId
			listItem.appendChild(this.newTaskForm)
		}
		input.focus()
	}
	moveTaskForm(e) {
		const button = document.getElementById("move-task-up")
		this.addSubtaskForm(Number(button.dataset.id))
	}
	toggleTask(e) {
		const { checked, id } = e.target
		const task = this.taskList.getTask(Number(id))
		if (task) {
			task.done = checked
		}
		this.taskList.updateChildrenDone(task.id, checked)
		this.taskList.updateTasksDone()
		this.taskStorage.updateList(this.taskList)
		this.updateTasksList()
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
		this.taskList.removeTask(Number(id))
		this.renderTasks()
		this.taskStorage.updateList(this.taskList)
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
		this.addSubtaskForm(parentId)
		this.taskStorage.updateList(this.taskList)
	}
	renderTasks() {
		this.container.textContent = ""
		this.container.appendChild(this.createTaskList())
		if (this.taskList) {
			this.addSubtaskForm()
		}
	}
	renderMenu() {
		this.menu.textContent = ""
		this.menu.appendChild(createListNavigation({
			items: this.taskStorage.getLists(),
			currentItem: this.taskList || {},
			selectListHandler: this.selectListName.bind(this),
			createListHandler: this.createNewList.bind(this),
			deleteListHandler: this.deleteList.bind(this)
		}))
	}
	render() {
		this.taskList = this.taskStorage.getList()
		this.renderMenu()
		this.renderTasks()
	}
}

const tb = new TaskBoard()
document.getElementById("demo").addEventListener("click", tb.loadDemoData.bind(tb))