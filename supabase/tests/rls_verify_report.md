# RLS Verification Report

Generated: 2026-05-20 Asia/Dhaka
Project ref: ibklmeyygujjddntbjsy
Command: `npx supabase db query --linked --file supabase\tests\rls_verify.sql --output json`

## Results

| Check | Result | Evidence |
|-------|--------|----------|
| CHW_A visible patient count | PASS | `56` rows visible to CHW_A under authenticated role |
| CHW_A blocked from CHW_B patients (SELECT) | PASS | `chw_a_visible_chw_b_patient_count = 0` |
| CHW_A blocked from CHW_B patients (INSERT) | PASS | Insert rejected: `new row violates row-level security policy for table "patients"` |

## Raw Output

```json
{
  "rows": [
    {
      "check_name": "chw_a_cross_chw_insert_rejected",
      "evidence": "new row violates row-level security policy for table \"patients\"",
      "result_value": "true"
    },
    {
      "check_name": "chw_a_visible_chw_b_patient_count",
      "evidence": "Rows with CHW_B chw_id visible to CHW_A under authenticated role",
      "result_value": "0"
    },
    {
      "check_name": "chw_a_visible_patient_count",
      "evidence": "Rows visible to CHW_A under authenticated role",
      "result_value": "56"
    }
  ]
}
```
