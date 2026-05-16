import { Route, Switch } from 'wouter'
import { HomeScreen } from '@/features/home/HomeScreen'
import { NewTrainingScreen } from '@/features/training/NewTrainingScreen'
import { TrainingScreen } from '@/features/training/TrainingScreen'
import { EndLoggerScreen } from '@/features/end-logger/EndLoggerScreen'
import { HistoryScreen } from '@/features/history/HistoryScreen'
import { StatsScreen } from '@/features/stats/StatsScreen'
import { SettingsScreen } from '@/features/settings/SettingsScreen'
import { EquipmentScreen } from '@/features/equipment/EquipmentScreen'

export function App() {
  return (
    <Switch>
      <Route path="/" component={HomeScreen} />
      <Route path="/training/new" component={NewTrainingScreen} />
      <Route path="/training/:id/end/:endId">
        {(params) => (
          <EndLoggerScreen
            key={params.endId}
            trainingId={params.id}
            endId={params.endId}
          />
        )}
      </Route>
      <Route path="/training/:id">
        {(params) => <TrainingScreen trainingId={params.id} />}
      </Route>
      <Route path="/history" component={HistoryScreen} />
      <Route path="/stats" component={StatsScreen} />
      <Route path="/settings" component={SettingsScreen} />
      <Route path="/equipment" component={EquipmentScreen} />
      <Route>
        <div className="p-6 text-center text-muted">Страница не найдена</div>
      </Route>
    </Switch>
  )
}
