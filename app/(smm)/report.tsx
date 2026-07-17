import { StyleSheet, View } from 'react-native'
import { BarChart3 } from 'lucide-react-native'
import { SmmHeader } from '../../components/SmmHeader'
import { EmptyState } from '../../components/ui/EmptyState'
import { colors } from '../../constants/colors'

// Placeholder: le query esistenti (getClientStats/getClientKPIs) risolvono il
// brand dal profilo dell'utente loggato, non accettano un brandId arbitrario —
// servirà una variante SMM-side prima di poter mostrare qui il report di un
// cliente specifico. Non ancora scoperto da nessun task numerato del piano,
// da pianificare a parte quando si arriva a questa tab.
export default function SmmReportScreen() {
  return (
    <View style={styles.screen}>
      <SmmHeader />
      <View style={styles.body}>
        <EmptyState
          icon={BarChart3}
          title="Report in arrivo"
          subtitle="Il report per cliente richiede una query dedicata lato SMM, non ancora implementata"
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
})
