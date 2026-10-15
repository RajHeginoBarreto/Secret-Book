package br.com.secretbook.quiz.engine;

/** O que uma opção escolhida soma ao perfil: "+1 em fantasia", "+0,5 no clima sombrio" etc. */
public record Effect(Dimension dimension, String value, double weight) {
}
