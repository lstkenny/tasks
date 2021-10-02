import Task from "./task.js"

class TaskList {
	constructor(data) {
		this.id = data.id || Date.now()
		this.name = data.name || "TODO"
		this.tasks = data.tasks || []
	}
	findTasks(params) {
		return this.tasks.filter(task => {
			let match = true
			for (let key in params) {
				match = match && params[key] === task[key]
			}
			return match
		})
	}
	getTask(id) {
		return this.findTasks({ id })[0]
	}
	hasSubtasks(id) {
		return !!this.findTasks({ parentId: id }).length
	}
	getSubtasks(id) {
		return this.findTasks({ parentId: id })
	}
	removeTask(id, recursive = true) {
		this.tasks = this.tasks.filter(task => task.id !== id)
		if (recursive) {
			this.getSubtasks(id).forEach(task => this.removeTask(task.id))
		}
	}
	addTask(data, parentId = null) {
		this.tasks.push(new Task({
			parentId,
			...data
		}))
	}
	moveTaskAfter(sourceId, targetId) {
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
}

export default TaskList