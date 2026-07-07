import SwiftUI

struct PlansView: View {
    @EnvironmentObject var vm: TimerViewModel
    @State private var plans: [Plan] = []
    @State private var showEditor = false
    @State private var editingPlan: Plan?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Presets
                Text("快速开始")
                    .font(.headline)
                    .foregroundColor(.secondary)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                    ForEach(Preset.all) { preset in
                        PresetCard(preset: preset) {
                            vm.startPreset(work: preset.work, rest: preset.rest)
                        }
                    }
                }

                Divider()

                // Custom Plans
                HStack {
                    Text("自定义计划")
                        .font(.headline)
                        .foregroundColor(.secondary)
                    Spacer()
                    Button(action: {
                        editingPlan = nil
                        showEditor = true
                    }) {
                        Label("新建", systemImage: "plus")
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                }

                ForEach(plans) { plan in
                    PlanCard(plan: plan, onStart: {
                        vm.startPlan(plan)
                    }, onEdit: {
                        editingPlan = plan
                        showEditor = true
                    }, onDelete: {
                        plans.removeAll { $0.id == plan.id }
                        StorageManager.shared.savePlans(plans)
                    })
                }

                if plans.isEmpty {
                    Text("暂无自定义计划")
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding()
                }
            }
            .padding()
        }
        .onAppear { plans = StorageManager.shared.loadPlans() }
        .sheet(isPresented: $showEditor) {
            PlanEditorView(plan: editingPlan) { savedPlan in
                if let idx = plans.firstIndex(where: { $0.id == savedPlan.id }) {
                    plans[idx] = savedPlan
                } else {
                    plans.append(savedPlan)
                }
                StorageManager.shared.savePlans(plans)
            }
        }
    }
}

struct PresetCard: View {
    let preset: Preset
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                Text(preset.icon)
                    .font(.title2)
                VStack(alignment: .leading, spacing: 2) {
                    Text(preset.label)
                        .font(.headline)
                    Text("工作\(preset.work)min · 休息\(preset.rest)min")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Spacer()
                Image(systemName: "play.fill")
            }
            .padding(12)
            .background(Color.secondary.opacity(0.06))
            .cornerRadius(10)
        }
        .buttonStyle(.plain)
    }
}

struct PlanCard: View {
    let plan: Plan
    let onStart: () -> Void
    let onEdit: () -> Void
    let onDelete: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(plan.name)
                    .font(.headline)
                Spacer()
                Text(formatMinutes(plan.totalWorkMinutes))
                    .font(.caption.bold())
                    .foregroundColor(.accentColor)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(Color.accentColor.opacity(0.1))
                    .cornerRadius(10)
            }
            Text(plan.steps.map { "\($0.type == .work ? "工作" : "休息") \($0.duration)min" }.joined(separator: " → "))
                .font(.caption)
                .foregroundColor(.secondary)
                .lineLimit(1)
            HStack(spacing: 8) {
                Button("开始", action: onStart)
                    .buttonStyle(.borderedProminent)
                    .controlSize(.small)
                Button("编辑", action: onEdit)
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                Button("删除", action: onDelete)
                    .buttonStyle(.plain)
                    .foregroundColor(.red)
                    .controlSize(.small)
            }
        }
        .padding(12)
        .background(Color.secondary.opacity(0.06))
        .cornerRadius(10)
    }
}

struct PlanEditorView: View {
    let plan: Plan?
    let onSave: (Plan) -> Void

    @State private var name: String = ""
    @State private var steps: [PlanStep] = [PlanStep(type: .work, duration: 25), PlanStep(type: .rest, duration: 5)]
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(plan == nil ? "新建计划" : "编辑计划")
                .font(.title2.bold())

            TextField("计划名称", text: $name)
                .textFieldStyle(.roundedBorder)

            ForEach($steps) { $step in
                HStack {
                    Picker("", selection: $step.type) {
                        Text("工作").tag(TimerMode.work)
                        Text("休息").tag(TimerMode.rest)
                    }
                    .frame(width: 80)
                    TextField("", value: $step.duration, format: .number)
                        .textFieldStyle(.roundedBorder)
                        .frame(width: 50)
                    Text("min")
                    Spacer()
                    Button(action: { steps.removeAll { $0.id == step.id } }) {
                        Image(systemName: "xmark")
                    }
                    .disabled(steps.count <= 1)
                }
            }

            Button(action: { steps.append(PlanStep(type: .work, duration: 25)) }) {
                Label("添加步骤", systemImage: "plus")
            }

            HStack {
                Spacer()
                Button("取消") { dismiss() }
                    .buttonStyle(.bordered)
                Button("保存") {
                    var p = plan ?? Plan(name: "", steps: [])
                    p.name = name
                    p.steps = steps
                    onSave(p)
                    dismiss()
                }
                .buttonStyle(.borderedProminent)
                .disabled(name.isEmpty)
            }
        }
        .padding()
        .frame(width: 420, height: 400)
        .onAppear {
            if let plan = plan {
                name = plan.name
                steps = plan.steps
            }
        }
    }
}
