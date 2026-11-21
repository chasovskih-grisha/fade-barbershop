import { useEffect, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { fetchArticle, type ArticleDto } from '../../../lib/api/articles';
import {
  canonicalArticleUrl,
  formatArticleDate,
  splitParagraphs,
} from '../../../lib/blog/article-view';
import { styles } from '../../index.styles';
import { ArticleError, ArticleLoading, ArticleMissing } from './article-states';

type ArticleState = 'loading' | 'ready' | 'missing' | 'error';

export default function BlogArticleScreen() {
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const slug = Array.isArray(params.slug) ? (params.slug[0] ?? '') : (params.slug ?? '');
  const [article, setArticle] = useState<ArticleDto | null>(null);
  const [state, setState] = useState<ArticleState>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let mounted = true;
    setState('loading');
    fetchArticle(slug)
      .then((result) => {
        if (!mounted) return;
        if (result.state === 'ok') {
          setArticle(result.article);
          setState('ready');
          return;
        }
        setState(result.state === 'notFound' ? 'missing' : 'error');
      })
      .catch(() => {
        if (mounted) setState('error');
      });
    return () => {
      mounted = false;
    };
  }, [slug, attempt]);

  if (state === 'loading') return <ArticleLoading />;
  if (state === 'missing') return <ArticleMissing />;
  if (state === 'error' || !article) {
    return <ArticleError onRetry={() => setAttempt((value) => value + 1)} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.hero} testID="article-title">
        {article.title}
      </Text>
      <Text style={styles.cardLabel}>{formatArticleDate(article.publishedAt)}</Text>
      {article.coverUrl ? (
        <Image
          source={{ uri: article.coverUrl }}
          accessibilityLabel={article.title}
          style={styles.blogCover}
        />
      ) : null}
      {splitParagraphs(article.body).map((paragraph, index) => (
        <Text key={index} style={styles.cardMuted} testID="article-paragraph">
          {paragraph}
        </Text>
      ))}
      <Pressable
        accessibilityRole="link"
        style={styles.cta}
        onPress={() => Linking.openURL(canonicalArticleUrl(article.slug))}
      >
        <Text style={styles.ctaLabel} testID="article-open-site">
          Відкрити на сайті
        </Text>
      </Pressable>
    </ScrollView>
  );
}
