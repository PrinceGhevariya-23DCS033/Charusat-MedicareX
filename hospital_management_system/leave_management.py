from department import Department

class LeaveManagement:
    def __init__(self):
        self.leave_requests = {}
        self.department = None

    def set_department(self, department):
        self.department = department

    def request_leave(self, staff_member, days):
        self.leave_requests[staff_member] = days
        print(f"{staff_member} has requested leave for {days} days.")

    def adjust_schedule(self, staff_schedule):
        if self.department is None:
            print("No department set for leave management.")
            return staff_schedule
        for staff, days in self.leave_requests.items():
            if staff in staff_schedule:
                # Logic to adjust the schedule based on leave
                print(f"Adjusting schedule for {staff} who is on leave for {days} days.")
                staff_schedule[staff] = 'Adjusted Schedule'  # Example adjustment
        print("Updated Schedule:", staff_schedule)  # Print the updated schedule
        return staff_schedule

# Example usage
if __name__ == "__main__":
    cardiology = Department("Cardiology")
    leave_manager = LeaveManagement()
    leave_manager.set_department(cardiology)
    leave_manager.request_leave('Alice', 3)
    leave_manager.adjust_schedule({'Alice': 'Morning', 'Bob': 'Afternoon'})
