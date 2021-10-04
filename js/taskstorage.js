import TaskList from "./tasklist.js"

class TaskStorage {
	constructor() {
		this.taskStorage = "tasks"
		this.idStorage = "task"
		this.lists = []
		this.list = null
		this.loadData()
	}
	clone(obj) {
		return JSON.parse(JSON.stringify(obj))
	}
	match(list, params) {
		let match = true
		for (let key in params) {
			match = match && params[key] === list[key]
		}
		return match
	}
	findList(params) {
		return this.lists.find(list => this.match(list, params))
	}
	findListIndex(params) {
		return this.lists.findIndex(list => this.match(list, params))
	}
	getLists() {
		return this.lists.map(list => ({ id: list.id, name: list.name }))
	}
	getList(id) {
		id = id || this.list || this.lists?.[0]?.id
		const list = this.findList({ id })
		if (list) {
			return new TaskList(list)
		}
		return null
	}
	updateList(list) {
		const index = this.findListIndex({ id: list.id })
		if (index >= 0) {
			this.list = list.id
			this.lists[index] = this.clone(list)
		}
		this.saveData()
	}
	createList(list) {
		list = new TaskList(list)
		this.list = list.id
		this.lists.push(this.clone(list))
		this.saveData()
	}
	deleteList(list) {
		const id = (typeof list === "object") ? list.id : list
		const index = this.findListIndex({ id })
		this.list = null
		this.lists.splice(index, 1)
		this.saveData()
	}
	loadData() {
		try {
			this.lists = JSON.parse(localStorage.getItem(this.taskStorage)) || []
			this.list = JSON.parse(localStorage.getItem(this.idStorage)) || null
		} catch(e) {
			console.warn(e)
			this.clearData()
		}
	}
	clearData() {
		this.lists = []
		this.list = null
		this.saveData()
	}
	saveData() {
		localStorage.setItem(this.taskStorage, JSON.stringify(this.lists))
		localStorage.setItem(this.idStorage, JSON.stringify(this.list))
	}
}

export default TaskStorage