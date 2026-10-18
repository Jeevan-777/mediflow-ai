
from scheduler import optimize_doctor_slot

doctors = [
    {"id": 1},
    {"id": 2}
]

slots = [
    {"id": 101, "available": True},
    {"id": 102, "available": False},
    {"id": 103, "available": True}
]

result = optimize_doctor_slot(doctors, slots)

print("Scheduler result:", result)

assert result is not None
assert result["doctor_id"] in [1, 2]
assert result["slot_id"] in [101, 103]

print("CP-SAT scheduler test passed!")
