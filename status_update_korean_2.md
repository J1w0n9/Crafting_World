`deno.json`에서 `@supabase/auth-ui-shared` import 맵 항목을 제거했습니다. `islands/Login.tsx` 파일에도 해당 모듈에 대한 직접적인 참조가 남아있지 않습니다.

이제 애플리케이션을 다시 실행해 보시고 `node:process` 및 `node:buffer`와 관련된 CORS 오류가 여전히 발생하는지 알려주십시오. 오류가 계속 발생하면 다음 단계로 `@supabase/supabase-js` 자체를 조사해야 합니다.