import { Link } from 'react-router'
import { PageHeader } from '../../components/ui/PageHeader'
import { usePageTitle } from '../../hooks/usePageTitle'
import styles from './PrivacyPage.module.css'

/** Política de privacidade resumida (LGPD — Lei 13.709/2018). Texto de protótipo, sem valor jurídico. */
export function PrivacyPage() {
  usePageTitle('Política de privacidade')
  return (
    <>
      <PageHeader
        eyebrow="LGPD"
        title="Política de privacidade"
        description="O mínimo de dados, para o máximo de leitura. Resumo em linguagem simples."
      />
      <article className={styles.page}>
        <section>
          <h2>Que dados guardamos</h2>
          <ul>
            <li>
              <strong>Conta:</strong> nome de usuário e senha (guardada só como hash, nunca em texto). Não pedimos
              e-mail, CPF, telefone nem endereço.
            </li>
            <li>
              <strong>Perfil de leitor:</strong> livros favoritos e lidos, gêneros que você gosta e não gosta, autores
              favoritos e comentários que você escreve.
            </li>
            <li>
              <strong>Uso do site:</strong> respostas do quiz feitas com a conta e a assinatura demonstrativa.
            </li>
          </ul>
        </section>
        <section>
          <h2>Para que usamos</h2>
          <p>
            Apenas para manter sua conta e recomendar livros que combinem com você (base legal: consentimento e
            execução do serviço). Não vendemos nem compartilhamos dados com terceiros.
          </p>
        </section>
        <section>
          <h2>O que fica público</h2>
          <p>
            Somente os comentários que você publica nos livros, acompanhados do seu nome de usuário. Escolha um nome
            que não identifique você, se preferir.
          </p>
        </section>
        <section>
          <h2>Seus direitos</h2>
          <p>
            Em <Link to="/minha-conta/perfil">Minha conta → Conta e privacidade</Link> você pode, a qualquer momento,
            baixar uma cópia de todos os seus dados (acesso e portabilidade), corrigir seu perfil e excluir a conta
            com tudo o que está ligado a ela (eliminação). Dúvidas? Fale com a gente pelo WhatsApp.
          </p>
        </section>
        <p className={styles.note}>Projeto demonstrativo: este texto ilustra o fluxo e não tem valor jurídico.</p>
      </article>
    </>
  )
}
