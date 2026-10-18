
from scheduler import optimize_replacement_doctor

doctors = [
    {"id": 9, "workload": 1, "is_active": True},
    {"id": 14, "workload": 3, "is_active": True},
]

busy_doctor_ids = {4, 14}

replacement = optimize_replacement_doctor(
    doctors,
    busy_doctor_ids
)

print("Selected replacement doctor:", replacement)

assert replacement == 9
print("Reassignment test passed!")
