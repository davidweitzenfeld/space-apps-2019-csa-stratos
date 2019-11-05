import {Observable, of, throwError} from 'rxjs';
import {delay, mergeMap, retryWhen} from 'rxjs/operators';

const DEFAULT_MAX_RETRIES = 5;
const DEFAULT_BACKOFF = 1000;

export function retryWithBackoff(
  delayMs: number,
  maxRetry = DEFAULT_MAX_RETRIES,
  backoffMs = DEFAULT_BACKOFF
) {
  let retries = maxRetry;

  return (src: Observable<any>) => src.pipe(
    retryWhen(errors => errors.pipe(
      mergeMap(error => {
        if (retries-- > 0) {
          const backoffTime = delayMs + (maxRetry - retries) * backoffMs;
          return of(error).pipe(delay(backoffTime));
        }
        return throwError(`Failed after ${maxRetry} retries.`, error);
      })
      )
    )
  );
}
