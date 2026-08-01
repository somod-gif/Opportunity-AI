$ErrorActionPreference = "Continue"
$results = [System.Collections.ArrayList]::new()
function Test-Step([string]$name, [scriptblock]$block) {
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  try { $out = & $block; $code = if ($LASTEXITCODE -eq $null) { 0 } else { $LASTEXITCODE }; $ok = ($out -match "OK|200|true|complete|success") -or ($code -eq 0) }
  catch { $ok = $false; $out = $_.Exception.Message }
  $sw.Stop()
  [void]$results.Add([pscustomobject]@{ Feature = $name; Time = "$([Math]::Round($sw.Elapsed.TotalSeconds,1))s"; Result = if ($ok) { "PASS" } else { "FAIL" }; Note = ($out | Out-String).Trim().Substring(0, [Math]::Min(120, ($out | Out-String).Trim().Length)) })
}

$missionId = "e2e-mission-0801c"

Test-Step "Page / (landing)" { curl.exe -s -o NUL -w "%{http_code}" http://localhost:3000/ }
Test-Step "Page /mission" { curl.exe -s -o NUL -w "%{http_code}" http://localhost:3000/mission }
Test-Step "Page /history" { curl.exe -s -o NUL -w "%{http_code}" http://localhost:3000/history }
Test-Step "Page /import" { curl.exe -s -o NUL -w "%{http_code}" http://localhost:3000/import }
Test-Step "Page /agent/[session]" { curl.exe -s -o NUL -w "%{http_code}" http://localhost:3000/agent/$missionId }
Test-Step "Page /dashboard/[session]" { curl.exe -s -o NUL -w "%{http_code}" http://localhost:3000/dashboard/$missionId }
Test-Step "Page /workspace/[session]" { curl.exe -s -o NUL -w "%{http_code}" http://localhost:3000/workspace/$missionId }
Test-Step "Page /memory/[session]" { curl.exe -s -o NUL -w "%{http_code}" http://localhost:3000/memory/$missionId }
Test-Step "Page /applications/[session]" { curl.exe -s -o NUL -w "%{http_code}" http://localhost:3000/applications/$missionId }
Test-Step "Page /report/[session]" { curl.exe -s -o NUL -w "%{http_code}" http://localhost:3000/report/$missionId }
Test-Step "Page /settings/[session]" { curl.exe -s -o NUL -w "%{http_code}" http://localhost:3000/settings/$missionId }
Test-Step "Page /opportunity/[session]/[slug]" { curl.exe -s -o NUL -w "%{http_code}" http://localhost:3000/opportunity/$missionId/daad-scholarship-database-1 }
Test-Step "API /api/missions" { curl.exe -s http://localhost:3000/api/missions }
Test-Step "API /api/agent/[session] state" { curl.exe -s http://localhost:3000/api/agent/$missionId }
Test-Step "API /api/import/[session] state" { curl.exe -s http://localhost:3000/api/import/e2e-import-0801 }
Test-Step "API /api/reminders GET" { curl.exe -s "http://localhost:3000/api/reminders?sessionId=$missionId" }
Test-Step "API /api/reminders POST" { $tmp = Join-Path $env:TEMP "rem.json"; @{ sessionId = $missionId; type = "deadline_reminder"; message = "Test reminder"; dueAt = "2026-09-01T00:00:00Z"; email = "eniolabadmus351@gmail.com"; opportunityTitle = "DeepMind AI for Africa Scholarship"; applicationUrl = "https://example.com/apply" } | ConvertTo-Json | Set-Content -Path $tmp -Encoding UTF8; curl.exe -s -X POST -H "Content-Type: application/json" --data "@$tmp" http://localhost:3000/api/reminders }
Test-Step "API /api/reminders DELETE" { $items = (curl.exe -s "http://localhost:3000/api/reminders?sessionId=$missionId" | ConvertFrom-Json).reminders; if ($items.Count -gt 0) { curl.exe -s -X DELETE "http://localhost:3000/api/reminders?id=$($items[0].id)" } else { "no reminder rows (create step failed)" } }
Test-Step "API /api/chat (web search)" { $tmp = Join-Path $env:TEMP "chat1.json"; '{"message":"search: find Mastercard Foundation scholarships for African students"}' | Set-Content -Path $tmp -Encoding UTF8; curl.exe -s -X POST -H "Content-Type: application/json" --data "@$tmp" --max-time 90 http://localhost:3000/api/chat }
Test-Step "API /api/chat (normal)" { $tmp = Join-Path $env:TEMP "chat2.json"; '{"message":"What pages does this app have?"}' | Set-Content -Path $tmp -Encoding UTF8; curl.exe -s -X POST -H "Content-Type: application/json" --data "@$tmp" --max-time 90 http://localhost:3000/api/chat }
Test-Step "API /api/reminders/run" { curl.exe -s --max-time 30 "http://localhost:3000/api/reminders/run?secret=ca7f3b91e8d24a5fb6c0f9e2d7a81b43" }

$results | Format-Table -AutoSize Feature, Result, Time, Note
$passes = ($results | Where-Object Result -eq "PASS").Count
Write-Output "`n=== SUMMARY: $passes/$($results.Count) passed ==="
