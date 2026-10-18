
from ortools.sat.python import cp_model


def optimize_doctor_slot(doctors, slots):
    model = cp_model.CpModel()
    assignments = {}

    for doctor in doctors:
        for slot in slots:
            if not slot.get("available", True):
                continue

            if slot.get("doctor_id") not in (None, doctor["id"]):
                continue

            assignments[(doctor["id"], slot["id"])] = (
                model.NewBoolVar(
                    f"doctor_{doctor['id']}_slot_{slot['id']}"
                )
            )

    if not assignments:
        return None

    model.Add(sum(assignments.values()) == 1)

    for slot in slots:
        variables = [
            var for (doctor_id, slot_id), var in assignments.items()
            if slot_id == slot["id"]
        ]
        if variables:
            model.Add(sum(variables) <= 1)

    workloads = {
        doctor["id"]: doctor.get("workload", 0)
        for doctor in doctors
    }

    model.Minimize(
        sum(
            workloads[doctor_id] * variable
            for (doctor_id, _), variable in assignments.items()
        )
    )

    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        for (doctor_id, slot_id), variable in assignments.items():
            if solver.Value(variable):
                return {
                    "doctor_id": doctor_id,
                    "slot_id": slot_id
                }

    return None


def select_replacement_doctor(doctors, appointment_time, workload_by_doctor):
    candidates = [
        {
            "id": doctor["id"],
            "workload": workload_by_doctor.get(doctor["id"], 0)
        }
        for doctor in doctors
        if doctor.get("is_active", True)
    ]

    slots = [{"id": appointment_time, "available": True}]

    return optimize_doctor_slot(candidates, slots)



def optimize_replacement_doctor(doctors, busy_doctor_ids):
    model = cp_model.CpModel()
    candidates = [
        doctor for doctor in doctors
        if doctor.get("is_active", True)
        and doctor["id"] not in busy_doctor_ids
    ]

    if not candidates:
        return None

    assignments = {
        doctor["id"]: model.NewBoolVar(f"doctor_{doctor['id']}")
        for doctor in candidates
    }

    model.Add(sum(assignments.values()) == 1)

    model.Minimize(
        sum(
            doctor.get("workload", 0) * assignments[doctor["id"]]
            for doctor in candidates
        )
    )

    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        for doctor_id, variable in assignments.items():
            if solver.Value(variable):
                return doctor_id

    return None
