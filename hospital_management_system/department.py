class Department:
    def __init__(self, name):
        self.name = name
        self.staff_members = []
        self.schedule = {}

    def add_staff(self, staff_member):
        self.staff_members.append(staff_member)
        self.schedule[staff_member] = 'Unscheduled'

    def set_schedule(self, staff_member, shift):
        if staff_member in self.staff_members:
            self.schedule[staff_member] = shift
        else:
            print(f"{staff_member} is not part of the {self.name} department.")

    def get_schedule(self):
        return self.schedule

# Example usage
if __name__ == "__main__":
    cardiology = Department("Cardiology")
    cardiology.add_staff("Dr. Smith")
    cardiology.set_schedule("Dr. Smith", "Morning")
    print(cardiology.get_schedule())
