"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { FormSubmission } from "@/lib/enhanced-forms-actions"

interface FormFieldsEditorProps {
  formData: Record<string, any>
  onChange: (key: string, value: any) => void
  readOnly?: boolean
}

export function FormFieldsEditor({ formData, onChange, readOnly = false }: FormFieldsEditorProps) {
  const numField = (id: string, label: string, float = false) => (
    <div key={id}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        value={formData[id] ?? ""}
        readOnly={readOnly}
        disabled={readOnly}
        onChange={(e) => {
          if (readOnly) return
          const val = float ? Number.parseFloat(e.target.value) || 0 : Number.parseInt(e.target.value) || 0
          onChange(id, val)
        }}
        placeholder="0"
        className={readOnly ? "bg-gray-50 cursor-default" : ""}
      />
    </div>
  )

  const textField = (id: string, label: string, placeholder = "") => (
    <div key={id}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={formData[id] ?? ""}
        readOnly={readOnly}
        disabled={readOnly}
        onChange={(e) => { if (!readOnly) onChange(id, e.target.value) }}
        placeholder={placeholder}
        className={readOnly ? "bg-gray-50 cursor-default" : ""}
      />
    </div>
  )

  const dateField = (id: string, label: string) => (
    <div key={id}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="date"
        value={formData[id] ?? ""}
        readOnly={readOnly}
        disabled={readOnly}
        onChange={(e) => { if (!readOnly) onChange(id, e.target.value) }}
        className={readOnly ? "bg-gray-50 cursor-default" : ""}
      />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {textField("group_name", "Group Name *", "Enter the group name")}
        {textField("location", "Location *", "Enter the location")}
        {textField("credit_sources", "Credit Sources / Bank / MFIs Name *", "Enter credit sources")}
        {numField("num_mfis", "Number of MFIs accessing the area *")}
        {numField("groups_bank_account", "Groups with Bank Account *")}
        {numField("members_bank_account", "Members with Bank Account *")}
        {numField("inactive_accounts", "Members with inactive accounts *")}
        {numField("num_insurers", "Number of insurers in the area *")}
        {numField("members_insurance", "Members with Insurance (agri/livestock/credit) *")}
        {numField("borrowed_groups", "No. of borrowed groups *")}
        {numField("members_applying_loans", "Members applying loans *")}
        {numField("loan_amount_applied", "Amount of loan applied *", true)}
        {dateField("date_loan_applied", "Date loan applied *")}
        {numField("loan_amount_approved", "Amount of Loan approved/received *", true)}
        {numField("members_received_loans", "No. of members received loans *")}
        {dateField("date_loan_received", "Date loan received *")}
        {numField("members_complaining_delay", "Members complaining long disbursement lead time *")}
        {numField("loan_default", "Loan on default *", true)}
        {numField("loan_delinquency", "Loan on delinquency *", true)}
        {numField("loan_dropout", "Loan Dropout members/groups *")}
        {numField("money_fraud", "Money fraud incidence")}
        {numField("trust_erosion", "Trust erosion in MFIs")}
        {numField("documentation_delay", "Documentation delay")}
        {numField("loan_cost_high", "Loan cost high? (0=No, 1=Yes)")}
        {numField("number_of_groups", "Number of groups *")}
        {numField("members_at_start", "Members at start *")}
        {numField("members_at_end", "Members at end *")}
        {numField("bros_at_start", "BROs at start *")}
        {numField("bros_at_end", "BROs at end *")}
        <div>
          <Label htmlFor="loan_uses">Loan uses (0 or 1) *</Label>
          <Input
            id="loan_uses"
            type="number"
            min={0}
            max={1}
            value={formData.loan_uses ?? ""}
            readOnly={readOnly}
            disabled={readOnly}
            onChange={(e) => {
              if (readOnly) return
              const v = Number.parseInt(e.target.value) || 0
              onChange("loan_uses", Math.min(1, Math.max(0, v)))
            }}
            placeholder="0"
            className={readOnly ? "bg-gray-50 cursor-default" : ""}
          />
          {!readOnly && <p className="text-xs text-gray-500 mt-1">Enter 0 or 1</p>}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="explain_barriers">Explain barriers for non-access to financial services</Label>
          <Textarea
            id="explain_barriers"
            value={formData.explain_barriers ?? ""}
            readOnly={readOnly}
            disabled={readOnly}
            onChange={(e) => { if (!readOnly) onChange("explain_barriers", e.target.value) }}
            placeholder="Describe the barriers..."
            rows={3}
            className={readOnly ? "bg-gray-50 cursor-default" : ""}
          />
        </div>
        <div>
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes ?? ""}
            readOnly={readOnly}
            disabled={readOnly}
            onChange={(e) => { if (!readOnly) onChange("notes", e.target.value) }}
            placeholder="Any additional notes..."
            rows={3}
            className={readOnly ? "bg-gray-50 cursor-default" : ""}
          />
        </div>
      </div>
    </div>
  )
}

/** Build a flat formData object from a FormSubmission for use in FormFieldsEditor */
export function formSubmissionToData(form: FormSubmission): Record<string, any> {
  return {
    group_name: form.group_name ?? "",
    location: form.location ?? "",
    credit_sources: form.credit_sources ?? "",
    num_mfis: form.num_mfis ?? 0,
    groups_bank_account: form.groups_bank_account ?? 0,
    members_bank_account: form.members_bank_account ?? 0,
    inactive_accounts: form.inactive_accounts ?? 0,
    num_insurers: form.num_insurers ?? 0,
    members_insurance: form.members_insurance ?? 0,
    borrowed_groups: form.borrowed_groups ?? 0,
    members_applying_loans: form.members_applying_loans ?? 0,
    loan_amount_applied: form.loan_amount_applied ?? 0,
    date_loan_applied: form.date_loan_applied ?? "",
    loan_amount_approved: form.loan_amount_approved ?? 0,
    members_received_loans: form.members_received_loans ?? 0,
    date_loan_received: form.date_loan_received ?? "",
    members_complaining_delay: form.members_complaining_delay ?? 0,
    loan_uses: form.loan_uses ?? 0,
    loan_default: form.loan_default ?? 0,
    loan_delinquency: form.loan_delinquency ?? 0,
    loan_dropout: form.loan_dropout ?? 0,
    money_fraud: form.money_fraud ?? 0,
    trust_erosion: form.trust_erosion ?? 0,
    documentation_delay: form.documentation_delay ?? 0,
    loan_cost_high: form.loan_cost_high ?? 0,
    explain_barriers: form.explain_barriers ?? "",
    number_of_groups: form.number_of_groups ?? 0,
    members_at_start: form.members_at_start ?? 0,
    members_at_end: form.members_at_end ?? 0,
    bros_at_start: form.bros_at_start ?? 0,
    bros_at_end: form.bros_at_end ?? 0,
    notes: form.notes ?? "",
  }
}
