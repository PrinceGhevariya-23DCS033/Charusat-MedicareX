class WorkloadDistribution:
    def __init__(self, staff_members):
        self.staff_members = staff_members
        self.workload = {staff: 0 for staff in staff_members}

    def assign_task(self, staff_member, task_weight):
        if staff_member in self.workload:
            self.workload[staff_member] += task_weight
            print(f"Assigned task with weight {task_weight} to {staff_member}. Current workload: {self.workload[staff_member]}")
        else:
            print(f"Staff member {staff_member} not found.")

    def distribute_tasks(self, tasks):
        for task, weight in tasks.items():
            least_loaded_staff = min(self.workload, key=self.workload.get)
            self.assign_task(least_loaded_staff, weight)

# Example usage
if __name__ == "__main__":
    staff = ['Alice', 'Bob', 'Charlie']
    workload_manager = WorkloadDistribution(staff)
    workload_manager.distribute_tasks({'Task1': 2, 'Task2': 3})
