import React, { Component } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import api from "../../services/api";

import Container from "../../components/Container";
import {
  Loading,
  Owner,
  IssueList,
  IssueTab,
  IssueButton,
  IssueFooter
} from "./styles";

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string
      })
    }).isRequired
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    filters: [
      { type: "all", description: "Todas" },
      { type: "open", description: "Abertas" },
      { type: "closed", description: "Fechadas" }
    ],
    filterActive: "all",
    page: 1
  };

  async componentDidMount() {
    const { match } = this.props;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: "open",
          per_page: 5,
          page: 1
        }
      })
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false
    });
  }

  handleFilterOnClick = async filter => {
    await this.setState({ filterActive: filter, page: 1 });
    this.loadIssues();
  };

  loadIssues = async () => {
    const { filterActive, page } = this.state;
    const { match } = this.props;

    const repoName = decodeURIComponent(match.params.repository);

    const issues = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: filterActive,
        per_page: 5,
        page
      }
    });

    this.setState({ issues: issues.data });
  };

  handlePage = async direction => {
    const { page } = this.state;
    const pageNumber = direction == "next" ? page + 1 : page - 1;

    await this.setState({ page: pageNumber });
    this.loadIssues();
  };

  render() {
    const {
      repository,
      issues,
      loading,
      filters,
      filterActive,
      page
    } = this.state;

    if (loading) {
      return <Loading>Carregando</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <IssueList>
          <IssueTab>
            {filters.map(filter => (
              <IssueButton
                key={filter.type}
                active={filter.type === filterActive}
                onClick={() => this.handleFilterOnClick(filter.type)}
                disabled={false}
              >
                {filter.description}
              </IssueButton>
            ))}
          </IssueTab>

          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}

          <IssueFooter>
            <IssueButton
              key="anterior"
              active={page > 1}
              disabled={page < 2}
              onClick={() => this.handlePage("before")}
            >
              Anterior
            </IssueButton>
            <span>Página: {page}</span>
            <IssueButton
              key="proximo"
              active={true}
              disabled={false}
              onClick={() => this.handlePage("next")}
            >
              Próximo
            </IssueButton>
          </IssueFooter>
        </IssueList>
      </Container>
    );
  }
}
